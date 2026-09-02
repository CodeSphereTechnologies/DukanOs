import React, { useState, useEffect, useCallback } from 'react';
import { APP_CONFIG, SEEDED_ACCOUNTS } from '../../../lib/constants';
import { authService } from '../../../services/auth.service';
import { apiClient } from '../../../services/api-client';
import { AuthContext } from './auth.context';
import type { User, LoginCredentials, RoleSlug } from '../../../types/auth.types';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem(APP_CONFIG.userKey);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(APP_CONFIG.tokenKey);
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (token) {
      apiClient.setToken(token);
    } else {
      apiClient.removeToken();
    }
  }, [token]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem(APP_CONFIG.tokenKey);
      localStorage.removeItem(APP_CONFIG.userKey);
    };

    window.addEventListener('dukanos:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('dukanos:unauthorized', handleUnauthorized);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      const authUser = response.data.user;
      const authToken = response.data.token;

      setUser(authUser);
      setToken(authToken);

      try {
        localStorage.setItem(APP_CONFIG.tokenKey, authToken);
        localStorage.setItem(APP_CONFIG.userKey, JSON.stringify(authUser));
      } catch {
        // Storage unavailable
      }

      return authUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const switchUserRole = useCallback(async (email: string): Promise<User> => {
    const account = SEEDED_ACCOUNTS.find((a) => a.email.toLowerCase() === email.toLowerCase());
    return login({
      email: account?.email || email,
      password: account?.password || 'password',
    });
  }, [login]);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch {
      // Ignore logout errors
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem(APP_CONFIG.tokenKey);
      localStorage.removeItem(APP_CONFIG.userKey);
      setIsLoading(false);
    }
  }, []);

  const hasRole = useCallback(
    (roles: RoleSlug | RoleSlug[]): boolean => {
      if (!user) return false;
      const roleList = Array.isArray(roles) ? roles : [roles];
      return roleList.includes(user.role.slug);
    },
    [user]
  );

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      if (user.role.slug === 'super_admin' || user.permissions.includes('*')) {
        return true;
      }
      return user.permissions.includes(permission);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        switchUserRole,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
