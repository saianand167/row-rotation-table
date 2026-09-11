import { useState, useEffect, useCallback } from 'react';

export function usePWAUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let registration;

    const handleServiceWorker = async () => {
      try {
        registration = await navigator.serviceWorker.register('/sw.js');

        // Check if there's already a worker waiting
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setUpdateAvailable(true);
        }

        // Listen for new service worker being installed
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(installingWorker);
              setUpdateAvailable(true);
            }
          });
        });

        // Periodic check for update every 15 minutes when app is open
        const interval = setInterval(() => {
          registration.update().catch(() => {});
        }, 15 * 60 * 1000);

        return () => clearInterval(interval);
      } catch (err) {
        console.error('Service worker registration failed:', err);
      }
    };

    handleServiceWorker();

    // Listen for controllerchange to reload when updated worker activates
    let refreshing = false;
    const handleControllerChange = () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const updateApp = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  }, [waitingWorker]);

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  return { updateAvailable, updateApp, dismissUpdate };
}
