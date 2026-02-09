import { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthContext } from './AuthContext';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    
    const intervalId = setInterval(() => {
      if (accessToken) {
        refreshAccessToken();
      }
    }, 14 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [accessToken]);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/refresh_token`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Auth check failed');
      }
      
      const data = await response.json();
      
      if (data.accessToken && data.email) {
        setAccessToken(data.accessToken);
        setUser({ 
          email: data.email, 
          name: data.name || '',
          userId: data.userId 
        });
      } else {
        setUser(null);
        setAccessToken('');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setAccessToken('');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      setAccessToken(data.accessToken);
      setUser({ 
        email: data.email, 
        name: data.name || '',
        userId: data.userId 
      });
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }

      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAccessToken('');
      setUser(null);
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  }, []);

  const refreshAccessToken = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/refresh_token`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Token refresh failed');
      }
      
      const data = await response.json();
      
      if (data.accessToken && data.email) {
        setAccessToken(data.accessToken);
        setUser({ 
          email: data.email, 
          name: data.name || '',
          userId: data.userId 
        });
        return data.accessToken;
      } else {
        setUser(null);
        setAccessToken('');
        return null;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      setUser(null);
      setAccessToken('');
      return null;
    }
  }, []);

  const requestWithAuth = useCallback(async (url, options = {}) => {
    let currentToken = accessToken;
    
    if (!currentToken) {
      currentToken = await refreshAccessToken();
    }
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }
    const fullUrl = url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL}${url}`;

    const response = await fetch(fullUrl, {
      ...options,
      headers,
      credentials: 'include',
    });
    
    if (response.status === 401 && currentToken) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        return fetch(url, {
          ...options,
          headers,
          credentials: 'include',
        });
      }
    }
    
    return response;
  }, [accessToken, refreshAccessToken]);

  const value = useMemo(() => ({
    user,
    accessToken,
    loading,
    login,
    register,
    logout,
    refreshAccessToken,
    requestWithAuth,
  }), [user, accessToken, loading, login, register, logout, refreshAccessToken, requestWithAuth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};