'use client';

import { useState } from 'react';
import { Link2, Check, Share2, Twitter, Facebook, Linkedin } from 'lucide-react';
import { useUIStore } from '@/store/ui.store';

interface ShareButtonsProps {
  title: string;
  slug: string;
  className?: string;
}

const DEFAULT_SITE_URL = 'https://remopay.remonode.com';

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const SOCIALS = [
  {
    name: 'X (Twitter)',
    icon: Twitter,
    buildUrl: (url: string, title: string) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    name: 'Facebook',
    icon: Facebook,
    buildUrl: (url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: 'LinkedIn',
    icon: Linkedin,
    buildUrl: (url: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    name: 'WhatsApp',
    icon: WhatsAppIcon,
    buildUrl: (url: string, title: string) =>
      `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
];

export function ShareButtons({ title, slug, className = '' }: ShareButtonsProps) {
  const { addToast } = useUIStore();
  const [copied, setCopied] = useState(false);

  const pageUrl = (): string => {
    if (typeof window !== 'undefined') {
      return new URL(`/blog/${slug}`, window.location.origin).href;
    }
    return `${DEFAULT_SITE_URL}/blog/${slug}`;
  };

  const handleCopy = async () => {
    const url = pageUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      addToast({ type: 'success', message: 'Link copied to clipboard' });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast({ type: 'error', message: 'Could not copy link' });
    }
  };

  const handleShare = async () => {
    const url = pageUrl();
    // Prefer the native Web Share API (opens the device share sheet for social apps).
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text: title, url });
      } catch {
        // User dismissed the share sheet — no action needed.
      }
      return;
    }
    // Fallback when Web Share API is unavailable: copy the link instead.
    await handleCopy();
  };

  const baseLink =
    'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-[#d71927] hover:bg-[#d71927] hover:text-white';

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-sm font-semibold text-gray-500">Share:</span>

      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy link to article"
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-[#d71927] hover:text-[#d71927]"
      >
        {copied ? <Check size={14} /> : <Link2 size={14} />}
        {copied ? 'Copied' : 'Copy link'}
      </button>

      <button
        type="button"
        onClick={handleShare}
        aria-label="Share article"
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#d71927] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#b91420]"
      >
        <Share2 size={14} />
        Share
      </button>

      <span className="mx-1 h-4 w-px bg-gray-200" aria-hidden="true" />

      {SOCIALS.map(({ name, icon: Icon, buildUrl }) => (
        <a
          key={name}
          href={buildUrl(pageUrl(), title)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${name}`}
          title={name}
          className={baseLink}
        >
          <Icon size={15} />
        </a>
      ))}
    </div>
  );
}
