import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type LoginData = {
  workspace: string;
  cuenta: string;
  password: string;
};

type AuthUser = {
  token: string;
  workspace: string;
  cuenta: string;
  role: string;
  domainId: number;
  domainName: string;
  fullName?: string | null;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (data: LoginData) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'fstrack_auth_user';
const API_BASE_URL = 'https://fstrack-backend.onrender.com';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        setUser(JSON.parse(raw));
      }
    } catch (error) {
      console.error('Error restoring session:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async ({
    workspace,
    cuenta,
    password,
  }: LoginData): Promise<{ success: boolean; error?: string }> => {
    try {
      const normalized = {
        workspace: workspace.trim(),
        cuenta: cuenta.trim(),
        password: password.trim(),
      };

      if (!normalized.workspace || !normalized.cuenta || !normalized.password) {
        return {
          success: false,
          error: 'Completá todos los campos.',
        };
      }

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspace: normalized.workspace,
          username: normalized.cuenta,
          password: normalized.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Credenciales inválidas.',
        };
      }

      const authUser: AuthUser = {
        token: data.token,
        workspace: data.domain.workspace,
        cuenta: data.user.username,
        role: data.user.role,
        domainId: data.domain.id,
        domainName: data.domain.name,
        fullName: data.user.fullName ?? null,
      };

      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      setUser(authUser);

      return { success: true };
    } catch (error) {
      console.error('Error signing in:', error);
      return {
        success: false,
        error: 'No se pudo iniciar sesión.',
      };
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}