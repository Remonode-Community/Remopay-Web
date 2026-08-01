'use client';

import { useState, type FormEvent } from 'react';
import { Mail } from 'lucide-react';
import { blogService } from '@/services/blog.service';
import { useUIStore } from '@/store/ui.store';

interface NewsletterSubscribeFormProps {
  source?: string;
  className?: string;
  variant?: 'card' | 'banner';
}

export function NewsletterSubscribeForm({
  source = 'blog-footer',
  className = '',
  variant = 'card',
}: NewsletterSubscribeFormProps) {
  const { addToast } = useUIStore();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const res = await blogService.subscribeNewsletter({
        email: email.trim(),
        first_name: firstName.trim() || undefined,
        source,
      });
      setDone(true);
      if (res.success) {
        addToast({
          type: res.data?.already_subscribed ? 'info' : 'success',
          message: res.data?.already_subscribed
            ? 'You are already subscribed to our newsletter.'
            : 'You have been subscribed to the Remopay newsletter.',
        });
      } else {
        addToast({ type: 'error', message: res.message || 'Subscription failed.' });
      }
    } catch {
      addToast({ type: 'error', message: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className={`${className} rounded-xl border border-green-200 bg-green-50 p-5 text-center`}>
        <Mail className="mx-auto mb-2 h-6 w-6 text-green-600" />
        <p className="font-semibold text-green-800">You're on the list!</p>
        <p className="mt-1 text-sm text-green-700">
          We'll send you the latest articles and product updates.
        </p>
      </div>
    );
  }

  const isBanner = variant === 'banner';

  return (
    <form
      onSubmit={handleSubmit}
      className={`${className} ${isBanner ? '' : 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm'}`}
    >
      {!isBanner && (
        <>
          <p className="mb-1 font-bold text-gray-900">Newsletter</p>
          <p className="mb-4 text-sm text-gray-600">
            Get the latest articles and product updates in your inbox.
          </p>
        </>
      )}
      <div className="space-y-2.5">
        {!isBanner && (
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name (optional)"
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#d71927] focus:outline-none focus:ring-2 focus:ring-[#d71927]/20"
          />
        )}
        <div className="flex gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            className="min-w-0 flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#d71927] focus:outline-none focus:ring-2 focus:ring-[#d71927]/20"
          />
          <button
            type="submit"
            disabled={loading}
            className="shrink-0 rounded-lg bg-[#d71927] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#b91420] disabled:opacity-50"
          >
            {loading ? 'Subscribing…' : 'Subscribe'}
          </button>
        </div>
      </div>
    </form>
  );
}
