'use client';

import { NewsletterCreateForm } from '@/components/admin/blog/NewsletterCreateForm';

export default function NewNewsletterPage() {
  return (
    <div className="min-h-screen space-y-6 bg-[radial-gradient(circle_at_top_right,rgba(215,25,39,0.12),transparent_32%),#f8f8f8] p-6 text-slate-950">
      <h2 className="mb-5 text-xl font-black text-gray-900">Create Newsletter Campaign</h2>
      <NewsletterCreateForm />
    </div>
  );
}
