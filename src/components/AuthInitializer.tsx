'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { safeGetItem } from '@/utils/safe-storage.utils';
import { authService } from '@/services/auth.service';
import { useInitialization } from '@/contexts/InitializationContext';
import { FEATURES } from '@/config/features';

/**
 * AuthInitializer Component
 * 
 * CENTRALIZED AUTHENTICATION & ROUTING LOGIC
 * 
 * Responsibilities:
 * 1. Wait for Zustand persistence middleware hydration
 * 2. Refresh user data from API for fresh verification flags
 * 3. Determine correct destination based on:
 *    - Authentication status
 *    - Email verification status
 *    - Phone verification status
 *    - User role (admin > agent > customer)
 * 4. Handle all redirects at app level to prevent race conditions
 * 5. Ensure consistent routing flow
 * 
 * Redirect Priority:
 *   1. Not authenticated → /auth/login
 *   2. Email not verified → /auth/verify-email
 *   3. Phone not verified → /auth/verify-phone
 *   4. Admin role → /admin
 *   5. Manager role → /admin/blog
 *   6. Agent role → /agent
 *   7. Customer/user → /dashboard
 */
export const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { setIsLoading, user, setUser, isHydrated, isPhoneVerified, isEmailVerified, activeRole } = useAuthStore();
  const { markInitializationComplete } = useInitialization();
  const [isMounted, setIsMounted] = useState(false);
  const [routingResolved, setRoutingResolved] = useState(false);
  const hasInitialized = useRef(false);

  // Ensure component only initializes on client after hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || hasInitialized.current) return;
    hasInitialized.current = true;

    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        let token: string | null = null;
        
        try {
          token = typeof window !== 'undefined' ? safeGetItem('token') : null;
        } catch (storageError: any) {
          console.error('[AuthInitializer] Storage error while getting token:', storageError);
          token = null;
        }

        if (token && user) {
          // Token exists and user is loaded from persistence
          // Refresh user data from API to get fresh verification flags
          try {
            if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_VERBOSE_LOGS === 'true') {
              console.log('[AuthInitializer] Refreshing user data to get fresh verification flags');
            }
            const response = await authService.getUser();
            
            if (response.success && response.data?.user) {
              // Check if account is suspended
              if (response.data.user.status === 'suspended') {
                console.warn('[AuthInitializer] Account suspended, clearing auth state');
                useAuthStore.getState().logout();
                router.replace('/auth/login?reason=suspended');
                return;
              }

              if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_VERBOSE_LOGS === 'true') {
                console.log('[AuthInitializer] User data refreshed:', {
                  email: response.data.user.email,
                  isEmailVerified: response.data.user.isEmailVerified,
                  isPhoneVerified: response.data.user.isPhoneVerified,
                });
              }
              // Update store with fresh user data
              setUser(response.data.user);
            } else {
              console.warn('[AuthInitializer] Failed to refresh user data:', response.message);
            }
          } catch (error: any) {
            // Check if it's a network error vs API error
            const isNetworkError = 
              error?.message?.includes('network') ||
              error?.message?.includes('Network') ||
              error?.code === 'ERR_NETWORK' ||
              error?.response?.status === 0 ||
              (error?.response?.status >= 500 && error?.response?.status < 600) ||
              error instanceof TypeError; // Network errors throw TypeError in fetch
            
            if (isNetworkError) {
              console.error('[AuthInitializer] Network error refreshing user data:', error);
              // Don't redirect - let the error page handle it
              throw new Error('Connection failed. Please check your internet connection and try again.');
            } else {
              console.error('[AuthInitializer] Error refreshing user data:', error);
              // Don't fail initialization if non-network errors occur
            }
          }
        } else if (!token) {
          // No token - user is not authenticated
          if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_VERBOSE_LOGS === 'true') {
            console.log('[AuthInitializer] No token found, user is not authenticated');
          }
        }
      } catch (error: any) {
        console.error('[AuthInitializer] Auth initialization error:', error);
        // Detect and handle connection/network errors
        const isNetworkError = 
          error?.message?.includes('network') ||
          error?.message?.includes('Network') ||
          error?.message?.includes('Connection') ||
          error?.code === 'ERR_NETWORK' ||
          error?.response?.status === 0 ||
          (error?.response?.status >= 500 && error?.response?.status < 600) ||
          error instanceof TypeError;
        
        if (isNetworkError) {
          console.error('[AuthInitializer] Network error detected, redirecting to offline page');
          router.push('/offline');
          return;
        }
      } finally {
        setIsLoading(false);
        setRoutingResolved(true);
        // Signal to other components (like PhoneVerificationEnforcer) that initialization is complete
        // and fresh verification flags are available
        markInitializationComplete();
      }
    };

    initializeAuth();
  }, [isMounted]);

  // Routing logic: Determine correct destination and redirect if needed
  useEffect(() => {
    if (!isMounted || !isHydrated || !routingResolved || !pathname) return;

    // Don't redirect from auth or public routes
    const publicAndAuthRoutes = [
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/verify-email',
      '/auth/verify-phone',
      '/auth',
      '/',
      '/about',
      '/careers',
      '/blog',
      '/faq',
      '/privacy',
      '/terms',
      '/support',
      '/multi-currency',
      '/offline',
      '/error',
      '/vtu',
      '/vtu/airtime',
      '/vtu/data',
      '/vtu/tv',
      '/vtu/bills',
    ];

    const isPublicRoute = publicAndAuthRoutes.some(route => {
      if (route === '/') return pathname === '/';
      return pathname?.startsWith(route);
    });

    if (isPublicRoute) {
      // On public routes, no routing logic needed
      return;
    }

    // Determine correct destination based on auth state
    let correctDestination: string | null = null;

    // Priority 1: Not authenticated
    if (!user) {
      correctDestination = '/auth/login';
    }
    // Priority 2: Email not verified
    else if (!isEmailVerified) {
      correctDestination = `/auth/verify-email?email=${encodeURIComponent(user.email)}`;
    }
    // Priority 3: Phone not verified (if feature is enabled)
    else if (!isPhoneVerified && FEATURES.PHONE_VERIFICATION_ENABLED) {
      correctDestination = `/auth/verify-phone?phone=${encodeURIComponent(user.phone_number || '')}`;
    }
    // Priority 4-6: Role-based routing
    // IMPORTANT: Use activeRole for routing (respects user's role selection)
    // but validate it against user.roles for security
    else {
      // Determine the role to use for routing
      let roleToRoute: string | null = null;

      // Use activeRole if it's set and valid
      if (activeRole !== null && activeRole !== undefined && user.roles?.includes(activeRole)) {
        roleToRoute = activeRole;
      } else {
        // Fallback to primary role if activeRole is invalid/not set
        if (user.roles?.includes('admin')) {
          roleToRoute = 'admin';
        } else if (user.roles?.includes('manager')) {
          roleToRoute = 'manager';
        } else if (user.roles?.includes('agent')) {
          roleToRoute = 'agent';
        } else if (user.roles && user.roles.length > 0) {
          roleToRoute = user.roles[0];
        }
      }

      // Route based on the determined role
      if (roleToRoute === 'admin') {
        correctDestination = '/admin';
      } else if (roleToRoute === 'manager') {
        correctDestination = '/admin/blog';
      } else if (roleToRoute === 'agent') {
        correctDestination = '/agent';
      } else {
        correctDestination = '/dashboard';
      }
    }

    // Redirect if not on the correct path
    if (correctDestination && !pathname?.startsWith(correctDestination.split('?')[0])) {
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_VERBOSE_LOGS === 'true') {
        console.log('[AuthInitializer] Routing:', {
          from: pathname,
          to: correctDestination,
          reason: !user ? 'not_authenticated' : !isEmailVerified ? 'email_not_verified' : !isPhoneVerified ? 'phone_not_verified' : 'role_based',
        });
      }
      router.replace(correctDestination);
    }
  }, [isMounted, isHydrated, routingResolved, pathname, user, isEmailVerified, isPhoneVerified, activeRole, router]);

  // Render children - routing happens via effects above
  return <>{children}</>;
};
