'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { PINSetupModal } from './shared/PINSetupModal';
import { pinService } from '@/services/pin.service';
import { useAlert } from '@/hooks/useAlert';

/**
 * PINSetupEnforcer Component
 * 
 * This component enforces PIN setup for users who don't have a PIN set.
 * It should be placed in the dashboard layout or root app layout.
 * 
 * If a user doesn't have a PIN:
 * 1. Show PIN setup modal (blocking)
 * 2. User must complete PIN setup before accessing the dashboard
 * 3. Update auth store PIN status after successful setup
 * 
 * Includes proper hydration guards to prevent server/client mismatches
 */
interface PINSetupEnforcerProps {
  showForNewUsers?: boolean; // Show PIN setup immediately for newly registered users
  children?: React.ReactNode; // Content to render (should be rendered always, with modal on top)
}

const PUBLIC_ROUTES = [
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
  '/multi-currency',
];

export function PINSetupEnforcer({ showForNewUsers = true, children }: PINSetupEnforcerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, pinStatus, setPinStatus, isHydrated } = useAuthStore();
  const isPublicRoute =
    typeof pathname === 'string' &&
    PUBLIC_ROUTES.some((route) => (route === '/' ? pathname === '/' : pathname.startsWith(route)));
  const { success, error: alertError } = useAlert();
  const [showPINModal, setShowPINModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component only operates after hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check PIN status on component mount
  useEffect(() => {
    if (!isMounted || !user || !isHydrated) return;
    // Skip PIN enforcement on public routes (e.g. blog, auth, landing pages)
    if (isPublicRoute) return;

    // If PIN status not set in store, it means either:
    // 1. User just logged in (PIN status should be from login response)
    // 2. User is accessing app fresh (check current status)
    if (!pinStatus) {
      checkPinStatus();
    } else if (!pinStatus.has_pin && showForNewUsers) {
      // User doesn't have PIN, show setup modal
      setShowPINModal(true);
    }
  }, [user, isMounted, isHydrated]);

  // Check current PIN status from backend
  const checkPinStatus = async () => {
    try {
      // Call verify endpoint to check status
      // If PIN not set, it will return PIN_NOT_SET error
      // We can catch that to determine PIN status
      await pinService.verifyPin('0000');
    } catch (error: any) {
      if (error?.response?.data?.code === 'PIN_NOT_SET') {
        // User doesn't have PIN
        setPinStatus({
          has_pin: false,
          is_locked: false,
          failed_attempts: 0,
        });

        if (showForNewUsers) {
          setShowPINModal(true);
        }
      } else if (error?.response?.data?.code === 'PIN_LOCKED') {
        setPinStatus({
          has_pin: true,
          is_locked: true,
          remaining_seconds: error?.response?.data?.remaining_seconds,
        });
      } else {
        // PIN is set
        setPinStatus({
          has_pin: true,
          is_locked: false,
        });
      }
    }
  };

  // Handle PIN setup
  const handlePINSetupSubmit = async (data: {
    newPin: string;
    newPinConfirmation: string;
    password: string;
  }) => {
    setIsLoading(true);
    try {
      const response = await pinService.setPin(
        data.newPin,
        data.newPinConfirmation,
        data.password
      );

      if (response?.success) {
        success('PIN set successfully!');

        // Update store with new PIN status
        setPinStatus({
          has_pin: true,
          is_locked: false,
          failed_attempts: 0,
        });

        setShowPINModal(false);
      } else {
        throw new Error(response?.message || 'Failed to set PIN');
      }
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to set PIN. Please try again.';
      alertError(errorMsg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Always render children - the page content */}
      {children}
      
      {/* Show PIN setup modal on top if needed (not on public routes) */}
      {!isPublicRoute && (
        <PINSetupModal
          isOpen={showPINModal}
          mode="setup"
          onSubmit={handlePINSetupSubmit}
          onSuccess={() => {
            // PIN setup complete
            setShowPINModal(false);
          }}
          onClose={() => {
            // Users cannot close this modal until PIN is set
            // They must complete PIN setup or can be redirected
            // For now, we prevent closing by not handling it
          }}
          isLoading={isLoading}
        />
      )}
    </>
  );
}
