import { createContext } from 'react';
import type { User, LoginCredentials, RoleSlug } from '../../../types/auth.types';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => Promise<void>;
  switchUserRole: (email: string) => Promise<User>;
  hasRole: (roles: RoleSlug | RoleSlug[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
