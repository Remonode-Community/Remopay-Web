import type { Metadata } from 'next';
import { BlogHeader } from '@/components/blog/BlogHeader';
import { Footer } from '@/components/shared/Footer';

export const metadata: Metadata = {
  title: 'Blog | Remopay',
  description:
    'Articles, guides and product updates from Remopay — digital finance, USD accounts, virtual cards and bill payments.',
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900">
      <BlogHeader />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
