export interface DriverInfo {
  id: number;
  nombre: string;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: 'CONDUCTOR';
  active: boolean;
  createdAt: string;
  conductorId: number;
  conductor: DriverInfo;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
}