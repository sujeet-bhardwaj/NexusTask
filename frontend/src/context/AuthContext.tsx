import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  allUsers: User[];
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  switchUser: (userId: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshUsers = async () => {
    try {
      const users = await api.getUsers();
      setAllUsers(users);
    } catch (err) {
      console.error('Failed to fetch user list', err);
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

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    api.setToken(res.token);
    setUser(res.user);
    await refreshUsers();
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
  };

  const switchUser = async (userId: string) => {
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
