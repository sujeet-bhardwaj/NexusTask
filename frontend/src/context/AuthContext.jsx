import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshUsers = async () => {
    try {
      const users = await api.getUsers();
      setAllUsers(users);
    } catch (err) {
      console.error('Failed to fetch user list', err);
    }
  };

  const loginAsDefaultManager = async () => {
    try {
      const res = await api.login('sarah.connor@services.com', 'password123');
      api.setToken(res.token);
      setUser(res.user);
      await refreshUsers();
    } catch (err) {
      console.error('Default login failed', err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = api.getToken();
      if (token) {
        try {
          const profile = await api.getMe();
          setUser(profile);
          await refreshUsers();
        } catch (err) {
          console.warn('Session expired or invalid, logging in as default manager', err);
          api.clearToken();
          await loginAsDefaultManager();
        }
      } else {
        // Auto-login as default Manager (Sarah Connor) for instant frictionless demoing!
        await loginAsDefaultManager();
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, pass) => {
    const res = await api.login(email, pass);
    api.setToken(res.token);
    setUser(res.user);
    await refreshUsers();
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
  };

  const switchUser = async (userId) => {
    try {
      setLoading(true);
      const res = await api.switchDemo(userId);
      api.setToken(res.token);
      setUser(res.user);
      await refreshUsers();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        allUsers,
        loading,
        login,
        logout,
        switchUser,
        refreshUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
