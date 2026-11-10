
import { SecureStorage } from '@aparajita/capacitor-secure-storage';

import { apiRequest } from '../api/api';

import type {
  AuthSession,
  AuthUser,
  LoginCredentials,
} from '../../interfaces/auth.interface';

const SESSION_KEY = 'routemind_driver_session';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const session = await apiRequest<AuthSession>(
      '/auth/driver/login',
      {
        method: 'POST',
        body: credentials,
      },
    );

    // Guardamos un objeto compatible con DataType.
    await SecureStorage.set(SESSION_KEY, {
      token: session.token,
      user: session.user,
    });

    return session;
  },

  async getStoredSession(): Promise<AuthSession | null> {
    const stored = await SecureStorage.get(SESSION_KEY);

    if (
      !stored ||
      typeof stored !== 'object' ||
      Array.isArray(stored) ||
      !('token' in stored) ||
      typeof stored.token !== 'string' ||
      !('user' in stored) ||
      typeof stored.user !== 'object' ||
      stored.user === null
    ) {
      return null;
    }

    return {
      token: stored.token,
      user: stored.user as AuthUser,
    };
  },

  async logout(): Promise<void> {
    await SecureStorage.remove(SESSION_KEY);
  },
};
