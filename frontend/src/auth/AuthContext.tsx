import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { AuthUser, login, register } from '../api/client';

const TOKEN_KEY = 'ochoymedio.auth.token';
const USER_KEY = 'ochoymedio.auth.user';

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  restoring: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    Promise.all([SecureStore.getItemAsync(TOKEN_KEY), SecureStore.getItemAsync(USER_KEY)])
      .then(([storedToken, storedUser]) => {
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser) as AuthUser);
        }
      })
      .catch(() => {
        SecureStore.deleteItemAsync(TOKEN_KEY);
        SecureStore.deleteItemAsync(USER_KEY);
      })
      .finally(() => setRestoring(false));
  }, []);

  const saveSession = async (nextToken: string, nextUser: AuthUser) => {
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, nextToken),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(nextUser)),
    ]);
    setToken(nextToken);
    setUser(nextUser);
  };

  const signIn = async (email: string, password: string) => {
    const response = await login(email, password);
    await saveSession(response.token, response.user);
  };

  const signUp = async (email: string, password: string) => {
    const response = await register(email, password);
    await saveSession(response.token, response.user);
  };

  const signOut = async () => {
    await Promise.all([SecureStore.deleteItemAsync(TOKEN_KEY), SecureStore.deleteItemAsync(USER_KEY)]);
    setToken(null);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, token, restoring, signIn, signUp, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
