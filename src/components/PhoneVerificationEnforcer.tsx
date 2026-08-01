'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useErrorPageContext } from '@/contexts/ErrorPageContext';
import { useInitialization } from '@/contexts/InitializationContext';
import { FEATURES } from '@/config/features';

/**
 * PhoneVerificationEnforcer Component
 * 
 * Prevents users from accessing protected routes until they verify their phone.
 * Works in conjunction with phone verification flow.
 * 
 * - If user is authenticated but phone not verified, silently redirect to /auth/verify-phone
 * - If on a protected route without phone verification, immediately redirect
 * - Uses router.replace() to prevent back button navigation
 * - Uses ref to prevent multiple redirects
 */
export function PhoneVerificationEnforcer({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isPhoneVerified, isHydrated } = useAuthStore();
  const { isErrorPage } = useErrorPageContext();
  const { isInitializationComplete } = useInitialization();
  const [isClient, setIsClient] = useState(false);
  const hasRedirectedRef = useRef(false);

  // Routes that don't require phone verification
  const publicRoutes = [
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
    '/offline',
    '/vtu',
    '/vtu/airtime',
    '/vtu/data',
    '/vtu/tv',
    '/vtu/bills',
  ];

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isPublicRoute = publicRoutes.some((route) => {
    const normalizedPathname = pathname || '';
    // Exact match for '/' or starts with route followed by '/' or '?'
    if (route === '/') {
      return normalizedPathname === '/';
    }
    return normalizedPathname.startsWith(route + '/') || normalizedPathname === route;
  });

  // Main enforcement logic
  useEffect(() => {
    if (!isClient) return;
    if (!pathname) return;

    // Skip enforcement if disabled via feature flag
    if (!FEATURES.PHONE_VERIFICATION_ENABLED) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[PhoneVerificationEnforcer] Phone verification disabled via FEATURES.PHONE_VERIFICATION_ENABLED');
      }
      return;
    }

    // Wait for store to be hydrated from localStorage before enforcing
    if (!isHydrated) {
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_VERBOSE_LOGS === 'true') {
        console.log('[PhoneVerificationEnforcer] Waiting for store hydration...');
      }
      return;
    }

    // CRITICAL: Wait for AuthInitializer to complete its data refresh
    // This ensures we have fresh verification flags from the API, not stale localStorage data
    if (!isInitializationComplete) {
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_VERBOSE_LOGS === 'true') {
        console.log('[PhoneVerificationEnforcer] Waiting for AuthInitializer to refresh user data...');
      }
      return;
    }

    // Only log in development when verbose mode enabled
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_VERBOSE_LOGS === 'true') {
      console.log('[PhoneVerificationEnforcer]', {
        pathname,
        isPublicRoute,
        isAuthenticated,
        isPhoneVerified,
        userId: user?.id,
      });
    }

    // Only enforce on protected routes
    if (isPublicRoute) {
      hasRedirectedRef.current = false; // Reset when on public route
      return;
    }

    // Don't enforce on error pages (404, error boundary, etc.)
    if (isErrorPage) {
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_VERBOSE_LOGS === 'true') {
        console.log('[PhoneVerificationEnforcer] On error page, skipping enforcement');
      }
      return;
    }

    // User is not authenticated - no enforcement needed
    if (!isAuthenticated || !user) {
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_VERBOSE_LOGS === 'true') {
        console.log('[PhoneVerificationEnforcer] User not authenticated, skipping enforcement');
      }
      return;
    }

    // User has verified phone - allow access, reset redirect flag
    if (isPhoneVerified) {
      hasRedirectedRef.current = false;
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_VERBOSE_LOGS === 'true') {
        console.log('[PhoneVerificationEnforcer] Phone is verified, allowing access');
      }
      return;
    }

    // User is on protected route without phone verification - redirect
    // Use ref to ensure we only redirect once per unverified state
    if (!hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_VERBOSE_LOGS === 'true') {
        console.warn(
          '[PhoneVerificationEnforcer] Blocking unverified user from accessing:',
          pathname,
          '- Redirecting to verify-phone',
          { isPhoneVerified, userId: user?.id }
        );
      }
      router.replace(`/auth/verify-phone?next=${encodeURIComponent(pathname)}`);
    }
  }, [isClient, pathname, isPublicRoute, isAuthenticated, isPhoneVerified, isHydrated, isInitializationComplete, user, router]);

  // Render children normally - enforcement happens via redirect above
  return <>{children}</>;
}
