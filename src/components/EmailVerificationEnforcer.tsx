'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useErrorPageContext } from '@/contexts/ErrorPageContext';
import { useInitialization } from '@/contexts/InitializationContext';

/**
 * EmailVerificationEnforcer Component
 * 
 * Prevents users from accessing protected routes until they verify their email.
 * Works in conjunction with useAuth login redirect.
 * 
 * - If user is authenticated but email not verified, silently redirect to /auth/verify-email
 * - If on a protected route without email verification, immediately redirect
 * - Uses router.replace() to prevent back button navigation
 */
export function EmailVerificationEnforcer({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const { isErrorPage } = useErrorPageContext();
  const { isInitializationComplete } = useInitialization();
  const [isClient, setIsClient] = useState(false);
  const hasRedirectedRef = useRef(false);

  // Routes that don't require email verification
  const publicRoutes = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/verify-email',
    '/auth/verify-phone',  // Allow access to phone verification
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

  const isEmailVerified = user?.isEmailVerified === true;

  // Main enforcement logic
  useEffect(() => {
    if (!isClient) return;
    if (!pathname) return;

    // Wait for store to be hydrated from localStorage before enforcing
    if (!isHydrated) {
      return;
    }

    // CRITICAL: Wait for AuthInitializer to complete its data refresh
    // This ensures we have fresh verification flags from the API, not stale localStorage data
    if (!isInitializationComplete) {
      return;
    }

    // Only enforce on protected routes
    if (isPublicRoute) {
      hasRedirectedRef.current = false; // Reset when on public route
      return;
    }

    // Don't enforce on error pages (404, error boundary, etc.)
    if (isErrorPage) {
      return;
    }

    // User is not authenticated - no enforcement needed
    if (!isAuthenticated || !user) return;

    // User has verified email - allow access, reset redirect flag
    if (isEmailVerified) {
      hasRedirectedRef.current = false;
      return;
    }

    // User is on protected route without email verification - redirect
    // Use ref to ensure we only redirect once per unverified state
    if (!hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      console.warn(
        '[EmailVerificationEnforcer] Blocking unverified user from accessing:',
        pathname,
        '- Redirecting to verify-email'
      );
      const email = user?.email || '';
      router.replace(`/auth/verify-email?email=${encodeURIComponent(email)}`);
    }
  }, [isClient, pathname, isPublicRoute, isAuthenticated, isEmailVerified, isHydrated, isInitializationComplete, user, router]);

  // Render children normally - enforcement happens via redirect above
  return <>{children}</>;
}
