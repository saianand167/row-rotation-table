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

  // Register Service Worker and subscribe to Web Push Notifications
  useEffect(() => {
    async function registerWebPush() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${API_BASE}/notifications/vapid-public-key`);
        const { publicKey } = await res.json();

        if (!publicKey) return;

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
      } catch (err) {
        console.error('Service Worker / Push Registration failed:', err);
      }
    }

    registerWebPush();
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

      setLiveNotification({ title, msg });
      setTimeout(() => setLiveNotification(null), 5000);

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body: msg,
        });
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
    notificationsEnabled: true,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      {liveNotification && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce bg-emerald-600 dark:bg-emerald-500 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400 max-w-sm">
          <span className="text-2xl">🔔</span>
          <div>
            <p className="text-sm font-bold">{liveNotification.title}</p>
            <p className="text-xs opacity-90">{liveNotification.msg}</p>
          </div>
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
