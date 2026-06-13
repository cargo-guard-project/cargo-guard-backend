import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api, clearTokens, getAccessToken, setTokens } from '../api/client';
import { decodeJwt, type JwtUser } from './jwt';

interface AuthContextValue {
  user: JwtUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  canOperate: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<JwtUser | null>(() => decodeJwt(getAccessToken()));

  const value = useMemo<AuthContextValue>(() => ({
    user,
    canOperate: user?.role === 'admin' || user?.role === 'operator',
    isAdmin: user?.role === 'admin',
    login: async (email: string, password: string) => {
      const tokens = await api.login(email, password);
      setTokens(tokens);
      setUser(decodeJwt(tokens.accessToken));
    },
    logout: async () => {
      try {
        await api.logout();
      } finally {
        clearTokens();
        setUser(null);
      }
    },
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
