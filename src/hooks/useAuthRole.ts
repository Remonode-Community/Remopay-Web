import { useAuth } from './useAuth';
import { useAuthStore } from '@/store/auth.store';

/**
 * Hook for checking user roles and permissions
 * Provides utilities for role-based access control
 */
export const useAuthRole = () => {
  const { user } = useAuth();
  const { activeRole } = useAuthStore();

  /**
   * Get the current active role
   */
  const getCurrentRole = (): string | null => {
    return activeRole || user?.roles?.[0] || null;
  };

  return {
    /**
     * Check if user has a specific role
     */
    hasRole: (role: string): boolean => {
      return user?.roles?.includes(role) ?? false;
    },

    /**
     * Check if user has any of the provided roles
     */
    hasAnyRole: (roles: string[]): boolean => {
      return user?.roles?.some((r) => roles.includes(r)) ?? false;
    },

    /**
     * Check if user has all of the provided roles
     */
    hasAllRoles: (roles: string[]): boolean => {
      return roles.every((r) => user?.roles?.includes(r)) ?? false;
    },

    /**
     * Check if user has a specific permission
     */
    hasPermission: (permission: string): boolean => {
      return user?.permissions?.includes(permission) ?? false;
    },

    /**
     * Check if user has any of the provided permissions
     */
    hasAnyPermission: (permissions: string[]): boolean => {
      return user?.permissions?.some((p) => permissions.includes(p)) ?? false;
    },

    /**
     * Get the current active role
     */
    getCurrentRole,

    /**
     * Check if the active role matches a specific role
     */
    isCurrentRole: (role: string): boolean => {
      return getCurrentRole() === role;
    },

    /**
     * Get all user roles
     */
    getRoles: (): string[] => {
      return user?.roles ?? [];
    },

    /**
     * Get all user permissions
     */
    getPermissions: (): string[] => {
      return user?.permissions ?? [];
    },

    /**
     * Check if user is admin (has admin role)
     */
    isAdmin: (): boolean => {
      return user?.roles?.includes('admin') ?? false;
    },

    /**
     * Check if user is manager (has manager role - blog & newsletter management)
     */
    isManager: (): boolean => {
      return user?.roles?.includes('manager') ?? false;
    },

    /**
     * Check if user is agent (has agent role)
     */
    isAgent: (): boolean => {
      return user?.roles?.includes('agent') ?? false;
    },

    /**
     * Check if user is customer (has no higher roles)
     */
    isCustomer: (): boolean => {
      return !user?.roles || user.roles.length === 0 || (!user.roles.includes('admin') && !user.roles.includes('manager') && !user.roles.includes('agent'));
    },

    /**
     * Check if user can switch roles (has multiple roles)
     */
    canSwitchRoles: (): boolean => {
      return (user?.roles?.length ?? 0) > 1;
    },

    /**
     * Get the user object
     */
    getUser: () => user,

    /**
     * Get active role for displaying UI
     */
    getActiveRole: (): string | null => {
      return activeRole;
    },

    /**
     * Check if user has access to a specific dashboard
     * @param dashboardRole - The role required for a dashboard
     */
    canAccessDashboard: (dashboardRole: 'admin' | 'manager' | 'agent' | 'customer'): boolean => {
      if (!user) return false;
      
      const current = getCurrentRole();
      
      // Admin can access everything
      if (current === 'admin') return true;
      
      // Manager can access manager (blog) and customer dashboards
      if (current === 'manager') return dashboardRole === 'manager' || dashboardRole === 'customer';
      
      // Agent can access agent and customer dashboards
      if (current === 'agent') return dashboardRole === 'agent' || dashboardRole === 'customer';
      
      // Customer can only access customer dashboard
      return dashboardRole === 'customer';
    },
  };
};
