import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AuthContext } from './AuthContext';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(true);

  const accessTokenRef = useRef('');

  const setTokens = useCallback((token) => {
    accessTokenRef.current = token;
    setAccessToken(token);
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (accessTokenRef.current) {
        refreshAccessToken();
      }
    }, 14 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []); 

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
        setTokens(data.accessToken);
        setUser({
          email: data.email,
          name: data.name || '',
          userId: data.userId,
        });
      } else {
        setUser(null);
        setTokens('');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setTokens('');
    } finally {
      setLoading(false);
    }
  }, [setTokens]);

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
        setTokens(data.accessToken);
        setUser({
          email: data.email,
          name: data.name || '',
          userId: data.userId,
        });
        return data.accessToken;
      } else {
        setUser(null);
        setTokens('');
        return null;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      setUser(null);
      setTokens('');
      return null;
    }
  }, [setTokens]);

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
      setTokens(data.accessToken);
      setUser({
        email: data.email,
        name: data.name || '',
        userId: data.userId,
      });

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }, [setTokens]);

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
      setTokens('');
      setUser(null);
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  }, [setTokens]);

  const requestWithAuth = useCallback(async (url, options = {}) => {
    let currentToken = accessTokenRef.current;

    if (!currentToken) {
      currentToken = await refreshAccessToken();
    }

    const fullUrl = url.startsWith('http')
      ? url
      : `${import.meta.env.VITE_API_URL}${url}`;

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(currentToken && { Authorization: `Bearer ${currentToken}` }),
    };

    const response = await fetch(fullUrl, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (response.status === 401 && currentToken) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return fetch(fullUrl, {
          ...options,
          headers: { ...headers, Authorization: `Bearer ${newToken}` },
          credentials: 'include',
        });
      }
    }

    return response;
  }, [refreshAccessToken]);

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