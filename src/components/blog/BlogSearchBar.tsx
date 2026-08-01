'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';

interface BlogSearchBarProps {
  initialValue?: string;
  placeholder?: string;
  className?: string;
}

export function BlogSearchBar({
  initialValue = '',
  placeholder = 'Search articles...',
  className = '',
}: BlogSearchBarProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const query = value.trim();
    if (!query) {
      router.push('/blog');
      return;
    }
    router.push(`/blog?search=${encodeURIComponent(query)}`);
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`} role="search">
      <Search
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        size={18}
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-11 pr-24 text-sm text-gray-900 placeholder-gray-400 transition focus:border-[#d71927] focus:outline-none focus:ring-2 focus:ring-[#d71927]/20"
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-[#d71927] px-4 py-1.5 text-sm font-bold text-white transition hover:bg-[#b91420]"
      >
        Search
      </button>
    </form>
  );
}
