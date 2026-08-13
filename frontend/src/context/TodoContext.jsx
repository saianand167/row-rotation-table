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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user has a valid session on mount
  useEffect(() => {
    const storedToken = sessionStorage.getItem('todo_token');
    if (storedToken) {
      setAuthToken(storedToken);
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
      setUser(data.user);
      setIsAuthenticated(true);
    } catch {
      clearAuthToken();
      sessionStorage.removeItem('todo_token');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await loginUser(username, password);
    if (data.success && data.token) {
      sessionStorage.setItem('todo_token', data.token);
      setUser(data.user);
      setIsAuthenticated(true);
    }
    return data;
  }, []);

  const register = useCallback(async (username, password) => {
    const data = await registerUser(username, password);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    sessionStorage.removeItem('todo_token');
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
