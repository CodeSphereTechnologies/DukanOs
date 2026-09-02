import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ProtectedRoute } from '../../routes/ProtectedRoute';
import { RoleRoute } from '../../routes/RoleRoute';
import { AuthContext, type AuthContextType } from '../../features/auth/context/auth.context';
import type { User } from '../../types/auth.types';

const mockUser: User = {
  id: 1,
  name: 'Store Owner',
  email: 'owner@punjabelectric.pk',
  status: 'active',
  role: { id: 2, name: 'Owner', slug: 'owner' },
  tenant: {
    id: 1,
    name: 'Punjab Electric Store',
    slug: 'punjab-electric-store',
    city: 'Lahore',
    currency: 'PKR',
    timezone: 'Asia/Karachi',
    status: 'active',
  },
  permissions: ['products.view', 'products.create'],
};

const createMockAuth = (user: User | null, isAuthenticated = true): AuthContextType => ({
  user,
  token: isAuthenticated ? 'mock-token' : null,
  isAuthenticated,
  isLoading: false,
  login: async () => mockUser,
  logout: async () => {},
  switchUserRole: async () => mockUser,
  hasRole: (roles) => {
    if (!user) return false;
    const list = Array.isArray(roles) ? roles : [roles];
    return list.includes(user.role.slug);
  },
  hasPermission: () => true,
});

describe('Routing and Guard Protection', () => {
  it('renders children inside ProtectedRoute when user is authenticated', () => {
    render(
      <AuthContext.Provider value={createMockAuth(mockUser, true)}>
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content Area</div>
          </ProtectedRoute>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Protected Content Area')).toBeInTheDocument();
  });

  it('renders children in RoleRoute when user has allowed role', () => {
    render(
      <AuthContext.Provider value={createMockAuth(mockUser, true)}>
        <MemoryRouter>
          <RoleRoute allowedRoles={['owner', 'manager']}>
            <div>Owner Restricted Area</div>
          </RoleRoute>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Owner Restricted Area')).toBeInTheDocument();
  });
});
