import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE_URL } from '@/constants/api';
import {
  getLoginError,
  LOGIN_NETWORK_ERROR,
  TIMEOUT_ERROR,
  type ApiError,
} from '@/utils/api-error';

const LOGIN_TIMEOUT_MS = 15000;

type LoginData = {
  workspace: string;
  cuenta: string;
  password: string;
};

export type SignInResult = { success: boolean; error?: ApiError };

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
  signIn: (data: LoginData) => Promise<SignInResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'fstrack_auth_user';

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
  }: LoginData): Promise<SignInResult> => {
    const normalized = {
      workspace: workspace.trim(),
      cuenta: cuenta.trim(),
      password: password.trim(),
    };

    if (!normalized.workspace || !normalized.cuenta || !normalized.password) {
      return {
        success: false,
        error: {
          title: 'Completá todos los campos.',
          detail: 'Espacio de trabajo, cuenta y contraseña son obligatorios.',
        },
      };
    }

    // El servidor vive en Azure App Service, que puede quedar frío y tardar en
    // levantar. Sin este corte el botón se queda girando sin decir nada, que
    // es indistinguible de una app colgada.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), LOGIN_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace: normalized.workspace,
          username: normalized.cuenta,
          password: normalized.password,
        }),
        signal: controller.signal,
      });
    } catch (error: any) {
      // `fetch` solo tira si no hubo respuesta: sin red, DNS caído o conexión
      // rechazada porque el servidor no está escuchando. Nunca por un 401.
      console.error('Error signing in:', error);
      return {
        success: false,
        error: error?.name === 'AbortError' ? TIMEOUT_ERROR : LOGIN_NETWORK_ERROR,
      };
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      return { success: false, error: getLoginError(response.status) };
    }

    try {
      const data = await response.json();

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
      // Respuesta 200 con un cuerpo que no es el esperado. Azure devuelve HTML
      // mientras la app arranca, y antes eso caía en el catch general y se
      // reportaba como credenciales inválidas.
      console.error('Error parsing login response:', error);
      return {
        success: false,
        error: {
          title: 'Respuesta inesperada del servidor.',
          detail: 'No es un problema con tus credenciales. Intentá de nuevo en unos minutos.',
        },
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
