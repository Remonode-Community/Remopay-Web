'use client';

import { NewsletterCreateForm } from '@/components/admin/blog/NewsletterCreateForm';

export default function NewNewsletterPage() {
  return (
    <div>
      <h2 className="mb-5 text-xl font-black text-gray-900">Create Newsletter Campaign</h2>
      <NewsletterCreateForm />
    </div>
  );
}
