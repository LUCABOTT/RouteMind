import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { authService } from '../Services/auth/auth.service';

import type {
  AuthSession,
  LoginCredentials,
} from '../interfaces/auth.interface';

interface AuthContextType {
  session: AuthSession | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedSession = await authService.getStoredSession();

        setSession(storedSession);
      } catch (error) {
        console.error('Error al recuperar sesión:', error);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const newSession = await authService.login(credentials);

    setSession(newSession);
  };

  const logout = async () => {
    await authService.logout();
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de AuthProvider');
  }

  return context;
};