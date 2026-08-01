'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, MailOpen } from 'lucide-react';
import { blogService } from '@/services/blog.service';

type UnsubscribeState = 'loading' | 'success' | 'error';

function UnsubscribeView() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';
  const [state, setState] = useState<UnsubscribeState>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token && !email) {
      setState('error');
      setMessage('No unsubscribe token or email was provided.');
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        const res = await blogService.unsubscribeNewsletter({ token: token || undefined, email: email || undefined });
        if (cancelled) return;
        if (res.success) {
          setState('success');
          setMessage(res.message || 'You have been unsubscribed from the Remopay newsletter.');
        } else {
          setState('error');
          setMessage(res.message || 'We could not unsubscribe this address.');
        }
      } catch {
        if (!cancelled) {
          setState('error');
          setMessage('Something went wrong. Please try the link again.');
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [token, email]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-5">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        {state === 'loading' && (
          <>
            <MailOpen className="mx-auto h-12 w-12 animate-pulse text-[#d71927]" />
            <h1 className="mt-4 text-xl font-bold text-gray-900">Processing your request…</h1>
          </>
        )}

        {state === 'success' && (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <h1 className="mt-4 text-xl font-bold text-gray-900">You're unsubscribed</h1>
            <p className="mt-2 text-sm text-gray-600">{message}</p>
          </>
        )}

        {state === 'error' && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-red-600" />
            <h1 className="mt-4 text-xl font-bold text-gray-900">Unsubscribe failed</h1>
            <p className="mt-2 text-sm text-gray-600">{message}</p>
          </>
        )}

        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/blog"
            className="rounded-lg bg-[#d71927] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#b91420]"
          >
            Back to Blog
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
          >
            Visit Remopay
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={null}>
      <UnsubscribeView />
    </Suspense>
  );
}
