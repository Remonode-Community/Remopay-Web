'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ChevronRight, DollarSign } from 'lucide-react';

import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';

export default function USDAccountSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 6000);

    return () => clearTimeout(timer);
  }, [router]);
  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      className="flex min-h-[600px] items-center justify-center"
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
      `}</style>

      <Card className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 px-6 py-12 text-center sm:px-8">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="text-green-600" size={32} />
          </div>

          <h1 className="mt-4 text-2xl font-extrabold text-gray-900">Account Created!</h1>

          <p className="mt-2 text-sm text-gray-600">
            Your USD virtual account has been successfully created.
          </p>

          <div className="mt-8 rounded-2xl border border-green-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-600">
              What's Next
            </p>
            <div className="mt-4 space-y-3 text-left">
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-600">
                  1
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Documents Under Review</p>
                  <p className="text-xs text-gray-600">We'll verify your documents within 24 hours</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-600">
                  2
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Account Activation</p>
                  <p className="text-xs text-gray-600">Once approved, you can start receiving USD transfers</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-600">
                  3
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Share Your Details</p>
                  <p className="text-xs text-gray-600">Send your account number to receive USD payments</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
            <DollarSign className="text-blue-600" size={20} />
            <p className="text-sm font-semibold text-blue-900">Account Currency: USD</p>
          </div>

          <p className="mt-6 text-xs text-gray-600">
            Redirecting to dashboard in a few seconds...
          </p>

          <Button
            onClick={() => router.push('/dashboard')}
            fullWidth
            className="mt-6 h-12 rounded-2xl bg-[#d71927] text-base font-bold text-white shadow-sm shadow-red-300 hover:bg-[#b81420]"
          >
            <span>Go to Dashboard</span>
            <ChevronRight className="ml-2" size={20} />
          </Button>
        </div>
      </Card>
    </div>
  );
}
