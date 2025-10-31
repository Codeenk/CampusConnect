import { createContext, useContext, useEffect, useState } from 'react';
import apiService from '../services/api';

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState({
    user: null,
    loading: true,
    error: null,
  });

  const login = async (email, password) => {
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

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
