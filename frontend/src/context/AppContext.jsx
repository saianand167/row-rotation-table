import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { fetchRotation, getApiBaseUrl } from '../utils/api';
import { useAdminAuth } from '../hooks/useAdminAuth';

const AppContext = createContext(null);

function getSocketUrl() {
  return getApiBaseUrl().replace('/api', '');
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function AppProvider({ children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liveNotification, setLiveNotification] = useState(null);

  const [notificationPermission, setNotificationPermission] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported';
  });

  const auth = useAdminAuth();

  const refetch = useCallback(async () => {
    try {
      const result = await fetchRotation();
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch rotation:', err);
      setError('Unable to connect to the RRT server. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to Web Push Notifications with User Consent
  const enableNotifications = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported on this device/browser');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission !== 'granted') {
        localStorage.setItem('rrt_announcements_accepted', 'false');
        return false;
      }

      localStorage.setItem('rrt_announcements_accepted', 'true');

      const API_BASE = getApiBaseUrl();
      const res = await fetch(`${API_BASE}/notifications/vapid-public-key`);
      const { publicKey } = await res.json();

      if (!publicKey) return true;

      let subscription = await registration.pushManager.getSubscription();

      if (subscription && subscription.options && subscription.options.applicationServerKey) {
        const currentKeyArray = new Uint8Array(subscription.options.applicationServerKey);
        const newKeyArray = urlBase64ToUint8Array(publicKey);

        const isSameKey = currentKeyArray.length === newKeyArray.length &&
          currentKeyArray.every((val, index) => val === newKeyArray[index]);

        if (!isSameKey) {
          await subscription.unsubscribe();
          subscription = null;
        }
      }

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      await fetch(`${API_BASE}/notifications/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      });

      // Show welcome notification in notification bar
      if (registration && registration.showNotification) {
        registration.showNotification('Notifications Activated 🔔', {
          body: 'You will receive classroom rotation updates and announcements directly on your device.',
          icon: '/favicon.svg',
          badge: '/favicon.svg',
        });
      }

      return true;
    } catch (err) {
      console.error('Service Worker / Push Registration failed:', err);
      return false;
    }
  }, []);

  // Auto-subscribe immediately on page load and on first user click/touch
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    // 1. Try immediate auto-enable on mount
    enableNotifications();

    // 2. If permission is still 'default' (some browsers require user gesture), trigger on first click or touch
    if (Notification.permission === 'default') {
      const handleFirstInteraction = () => {
        enableNotifications();
      };
      window.addEventListener('click', handleFirstInteraction, { once: true });
      window.addEventListener('touchstart', handleFirstInteraction, { once: true });
      return () => {
        window.removeEventListener('click', handleFirstInteraction);
        window.removeEventListener('touchstart', handleFirstInteraction);
      };
    }
  }, [enableNotifications]);

  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [notificationsHistory, setNotificationsHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('rrt_notifications_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const openNotificationDrawer = useCallback(() => {
    setIsNotificationDrawerOpen(true);
    setUnreadNotificationsCount(0);
  }, []);

  const closeNotificationDrawer = useCallback(() => {
    setIsNotificationDrawerOpen(false);
  }, []);

  const toggleNotificationDrawer = useCallback(() => {
    setIsNotificationDrawerOpen((prev) => {
      if (!prev) setUnreadNotificationsCount(0);
      return !prev;
    });
  }, []);

  const markNotificationsAsRead = useCallback(() => {
    setUnreadNotificationsCount(0);
  }, []);

  const clearNotificationsHistory = useCallback(() => {
    setNotificationsHistory([]);
    setUnreadNotificationsCount(0);
    localStorage.removeItem('rrt_notifications_history');
  }, []);

  useEffect(() => {
    refetch();

    // Polling fallback every 10 seconds to ensure real-time consistency
    const pollInterval = setInterval(() => {
      refetch();
    }, 10000);

    // Connect to Socket.io server
    const socket = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to real-time WebSocket server');
    });

    socket.on('state_updated', (payload) => {
      refetch();
      
      let title = 'RRT Update ⚡';
      let msg = 'Admin updated seating or rotation settings.';

      switch (payload?.action) {
        case 'set_day':
          title = 'Day Updated 📅';
          msg = `Rotation set to Day ${payload.currentDay || ''}`;
          break;
        case 'announcement':
          title = 'New Announcement 📢';
          msg = payload.announcement?.text ? `"${payload.announcement.text}"` : 'Announcement updated by Admin';
          break;
        case 'generate_random':
          title = 'Random Seating Generated 🎲';
          msg = payload.day === 'Random' ? "Today's random layout is displayed!" : `Random layout generated for Day ${payload.day}`;
          break;
        case 'clear_random':
          title = 'Random Layout Cleared 🔄';
          msg = 'Restored standard rotation layout.';
          break;
        case 'pause':
          title = payload.isPaused ? 'Rotation Paused ⏸️' : 'Rotation Resumed ▶️';
          msg = payload.isPaused ? 'Auto-rotation is currently paused.' : 'Auto-rotation is active.';
          break;
        case 'add_leave_day':
          title = 'Holiday Added 🏖️';
          msg = `Leave day marked for ${payload.date}`;
          break;
        case 'remove_leave_day':
          title = 'Holiday Removed 📅';
          msg = `Leave day for ${payload.date} removed.`;
          break;
        case 'update_seating':
          title = 'Seating Arrangement Updated 🪑';
          msg = `Custom seating updated for Day ${payload.day}`;
          break;
        case 'reset_seating':
          title = 'Seating Reset 🪑';
          msg = `Day ${payload.day} reset to default seating.`;
          break;
        default:
          break;
      }

      // Add to In-App notification history
      const newNotificationItem = {
        id: Date.now().toString(),
        title,
        msg,
        timestamp: new Date().toISOString(),
      };

      setNotificationsHistory((prev) => {
        const updated = [newNotificationItem, ...prev.slice(0, 19)]; // Keep latest 20
        localStorage.setItem('rrt_notifications_history', JSON.stringify(updated));
        return updated;
      });
      setUnreadNotificationsCount((prev) => prev + 1);

      // In-App Toast Alert (Always works regardless of browser push permissions)
      setLiveNotification({ title, msg });
      setTimeout(() => setLiveNotification(null), 6000);

      // System notification if permission was granted
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(title, {
              body: msg,
              icon: '/favicon.svg',
              badge: '/favicon.svg',
              vibrate: [200, 100, 200],
            });
          }).catch(() => {
            new Notification(title, { body: msg, icon: '/favicon.svg' });
          });
        } else {
          new Notification(title, { body: msg, icon: '/favicon.svg' });
        }
      }
    });

    return () => {
      clearInterval(pollInterval);
      socket.disconnect();
    };
  }, [refetch]);

  const value = {
    rotationData: data,
    loading,
    error,
    refetch,
    auth,
    liveNotification,
    notificationsEnabled: notificationPermission === 'granted',
    notificationPermission,
    enableNotifications,
    isNotificationDrawerOpen,
    openNotificationDrawer,
    closeNotificationDrawer,
    toggleNotificationDrawer,
    notificationsHistory,
    unreadNotificationsCount,
    markNotificationsAsRead,
    clearNotificationsHistory,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      {liveNotification && (
        <div
          onClick={openNotificationDrawer}
          className="fixed bottom-5 right-5 z-50 animate-bounce cursor-pointer bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400/50 max-w-sm hover:scale-105 transition-transform"
        >
          <span className="text-2xl animate-pulse">🔔</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{liveNotification.title}</p>
            <p className="text-xs text-emerald-100 line-clamp-2">{liveNotification.msg}</p>
          </div>
          <span className="text-[10px] uppercase font-bold bg-white/20 px-1.5 py-0.5 rounded">View</span>
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
