'use client';

import React from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';

interface LockedServiceViewProps {
  locked: boolean;
  service: string;
  children: React.ReactNode;
  className?: string;
}

export function LockedServiceView({ locked, service, children, className }: LockedServiceViewProps) {
  return (
    <div className={`relative ${className ?? ''}`}>
      <div
        className={locked ? 'pointer-events-none select-none blur-[3px] opacity-70' : 'transition'}
        aria-hidden={locked || undefined}
      >
        {children}
      </div>
      {locked && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-[2px] px-4"
          role="region"
          aria-label={`Upgrade required to use ${service}`}
        >
          <div className="flex flex-col items-center text-center max-w-sm">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200">
              <Lock className="h-6 w-6 text-[#620707]" />
            </span>
            <p className="mt-4 text-base font-semibold text-gray-900">Upgrade your account</p>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Complete Tier 1 verification (BVN and profile details) to unlock {service}. It only
              takes a few minutes.
            </p>
            <Link
              href="/dashboard/settings"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-[#d71927] px-8 text-sm font-semibold text-white transition-colors hover:bg-[#b81420]"
            >
              Upgrade Account
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
