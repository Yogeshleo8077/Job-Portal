'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, tokenStore } from './api';
import type { Role, User } from './types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: Exclude<Role, 'ADMIN'>;
  companyName?: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    if (!tokenStore.get()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api<User>('/users/me');
      setUser(me);
    } catch {
      tokenStore.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();
  }, []);

  async function login(email: string, password: string) {
    const res = await api<AuthResponse>('/auth/login', {
      method: 'POST',
      auth: false,
      body: { email, password },
    });
    tokenStore.set(res.accessToken);
    setUser(res.user);
    return res.user;
  }

  async function register(input: RegisterInput) {
    const res = await api<AuthResponse>('/auth/register', {
      method: 'POST',
      auth: false,
      body: input,
    });
    tokenStore.set(res.accessToken);
    setUser(res.user);
    return res.user;
  }

  function logout() {
    tokenStore.clear();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refresh: loadMe }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
