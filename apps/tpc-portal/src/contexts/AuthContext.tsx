import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthState } from '../types';
import apiService from '../services/api';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  const login = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const { user } = await apiService.login(email, password);
      setState({ user, loading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      setState({ user: null, loading: false, error: message });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } finally {
      setState({ user: null, loading: false, error: null });
    }
  };

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('tpc_token');
      if (!token) {
        setState({ user: null, loading: false, error: null });
        return;
      }

      const user = await apiService.getCurrentUser();
      setState({ user, loading: false, error: null });
    } catch (error) {
      localStorage.removeItem('tpc_token');
      setState({ user: null, loading: false, error: null });
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Session timeout handler
  useEffect(() => {
    if (!state.user) return;

    const timeout = parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '1800000'); // 30 minutes
    let timeoutId: NodeJS.Timeout;
    let lastActivity = Date.now();

    const resetTimeout = () => {
      clearTimeout(timeoutId);
      lastActivity = Date.now();
      timeoutId = setTimeout(() => {
        logout();
      }, timeout);
    };

    const handleActivity = () => {
      if (Date.now() - lastActivity > 1000) { // Throttle to once per second
        resetTimeout();
      }
    };

    // Start timeout
    resetTimeout();

    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [state.user]);

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};