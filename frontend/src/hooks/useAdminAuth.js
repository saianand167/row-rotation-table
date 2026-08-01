import { useState, useCallback } from 'react';
import { verifyPin } from '../utils/api';

export function useAdminAuth() {
  const [pin, setPinState] = useState(() => {
    return localStorage.getItem('rrt_admin_pin') || null;
  });

  const login = useCallback(async (inputPin) => {
    try {
      const data = await verifyPin(inputPin);
      if (data.success) {
        localStorage.setItem('rrt_admin_pin', inputPin);
        setPinState(inputPin);
        return { success: true };
      }
      return { success: false, error: 'Invalid password. Access denied.' };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: err.response?.data?.error || 'Connection failed. Is the server running?' };
    }
  }, []);

  const savePin = useCallback((verifiedPin) => {
    localStorage.setItem('rrt_admin_pin', verifiedPin);
    setPinState(verifiedPin);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('rrt_admin_pin');
    setPinState(null);
  }, []);

  return {
    pin,
    isLoggedIn: pin !== null,
    login,
    savePin,
    logout,
  };
}
