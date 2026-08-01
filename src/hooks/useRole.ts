'use client';

import { useAuthStore } from '@/store/auth.store';
import { useMemo } from 'react';

export const useRole = () => {
  const { user } = useAuthStore();

  const roles = useMemo(() => user?.roles || [], [user?.roles]);

  const hasRole = (role: 'user' | 'agent' | 'admin' | 'manager') => {
    return roles.includes(role);
  };

  const isAdmin = useMemo(() => hasRole('admin'), [roles]);
  const isManager = useMemo(() => hasRole('manager'), [roles]);
  const isAgent = useMemo(() => hasRole('agent'), [roles]);
  const isUser = useMemo(() => hasRole('user'), [roles]);

  return {
    roles,
    hasRole,
    isAdmin,
    isManager,
    isAgent,
    isUser,
  };
};
