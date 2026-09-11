import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  loginUser,
  registerUser,
  logoutUser,
  fetchMe,
  setAuthToken,
  getAuthToken,
  clearAuthToken,
} from '../utils/todoApi';

const TodoContext = createContext(null);

export function TodoProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const cached = typeof window !== 'undefined' ? localStorage.getItem('todo_cached_user') : null;
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => {
    return typeof window !== 'undefined' && !localStorage.getItem('todo_token');
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return typeof window !== 'undefined' && !!localStorage.getItem('todo_token');
  });

  // Check if user has a valid session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('todo_token');
    if (storedToken) {
      setAuthToken(storedToken);
      setIsAuthenticated(true);
      checkAuth();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      if (!getAuthToken()) {
        setLoading(false);
        return;
      }
      const data = await fetchMe();
      if (data && data.user) {
        setUser(data.user);
        localStorage.setItem('todo_cached_user', JSON.stringify(data.user));
        setIsAuthenticated(true);
      }
    } catch (err) {
      // If server returned explicit 401 unauthorized, log out.
      // Otherwise (e.g. offline, timeout, server cold start), keep cached user session intact!
      if (err.response?.status === 401) {
        clearAuthToken();
        localStorage.removeItem('todo_token');
        localStorage.removeItem('todo_cached_user');
        setUser(null);
        setIsAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await loginUser(username, password);
    if (data.success && data.token) {
      localStorage.setItem('todo_token', data.token);
      if (data.user) {
        localStorage.setItem('todo_cached_user', JSON.stringify(data.user));
        setUser(data.user);
      }
      setIsAuthenticated(true);
    }
    return data;
  }, []);

  const register = useCallback(async (username, password) => {
    const data = await registerUser(username, password);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // ignore
    }
    clearAuthToken();
    localStorage.removeItem('todo_token');
    localStorage.removeItem('todo_cached_user');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
  };

  return (
    <TodoContext.Provider value={value}>
      {children}
    </TodoContext.Provider>
  );
}

export function useTodo() {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodo must be used within a TodoProvider');
  }
  return context;
}
