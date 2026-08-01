import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import { Clock, Eye, CalendarDays } from 'lucide-react';
import { fetchPublicPost } from '@/lib/blog-server';
import { BlogContentRenderer } from '@/components/blog/BlogContentRenderer';
import { BlogBreadcrumbs } from '@/components/blog/BlogBreadcrumbs';
import { CategoryPill } from '@/components/blog/CategoryPill';
import { TagPill } from '@/components/blog/TagPill';
import { RelatedPosts } from '@/components/blog/RelatedPosts';
import { NewsletterSubscribeForm } from '@/components/blog/NewsletterSubscribeForm';
import { formatDate } from '@/utils/format.utils';

const SITE_URL = 'https://remopay.remonode.com';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Dedupe the fetch between generateMetadata and the page render (one request per view).
const getPost = cache(async (slug: string) => {
  const data = await fetchPublicPost(slug);
  if (!data) return null;
  return data;
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPost(slug);
  if (!data) return {};

  const { post } = data;
  const title = post.seo?.title || post.title;
  const description = post.seo?.description || post.summary || '';
  const keywords = post.seo?.keywords;
  const canonical = post.url || `${SITE_URL}/blog/${slug}`;
  const og = (post.seo?.og_meta || {}) as Record<string, unknown>;
  const twitter = (post.seo?.twitter_meta || {}) as Record<string, unknown>;

  return {
    title,
    description,
    keywords: keywords || undefined,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonical,
      siteName: 'Remopay',
      publishedTime: post.published_at || undefined,
      modifiedTime: post.updated_at || undefined,
      images: post.cover_image ? [{ url: post.cover_image }] : undefined,
      ...og,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.cover_image ? [post.cover_image] : undefined,
      ...twitter,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getPost(slug);
  if (!data) notFound();

  const { post, related_posts: relatedPosts } = data;
  const cover = post.cover_image || post.featured_image;
  const jsonLd = post.json_ld;

  return (
    <>
      {jsonLd && (
        <>
          {jsonLd.article && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd.article) }}
            />
          )}
          {jsonLd.breadcrumbs && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd.breadcrumbs) }}
            />
          )}
        </>
      )}

      <article>
        {/* Breadcrumbs */}
        <div className="border-b border-gray-100 bg-gray-50/50 px-5 py-4 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <BlogBreadcrumbs
              crumbs={[
                { label: 'Blog', href: '/blog' },
                ...(post.categories?.[0]
                  ? [{ label: post.categories[0].name, href: `/blog/category/${post.categories[0].slug}` }]
                  : []),
                { label: post.title },
              ]}
            />
          </div>
        </div>

        {/* Header */}
        <header className="px-5 pt-10 lg:px-8">
          <div className="mx-auto max-w-3xl">
            {post.categories && post.categories.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {post.categories.map((category) => (
                  <CategoryPill key={category.id} category={category} />
                ))}
              </div>
            )}

            <h1 className="text-3xl font-black leading-tight tracking-tight text-gray-900 sm:text-4xl">
              {post.title}
            </h1>

            {post.summary && (
              <p className="mt-4 text-lg leading-7 text-gray-600">{post.summary}</p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-gray-100 py-4 text-sm text-gray-500">
              <span className="font-semibold text-gray-700">
                {post.author ? `${post.author.first_name} ${post.author.last_name}` : 'Remopay Team'}
              </span>
              {post.published_at && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={15} /> {formatDate(post.published_at)}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock size={15} /> {post.read_time || 1} min read
              </span>
              <span className="flex items-center gap-1.5">
                <Eye size={15} /> {post.view_count?.toLocaleString?.() ?? 0} views
              </span>
            </div>
          </div>
        </header>

        {/* Cover */}
        {cover && (
          <div className="px-5 pt-8 lg:px-8">
            <div className="mx-auto max-w-3xl overflow-hidden rounded-xl">
              <Image
                src={cover}
                alt={post.title}
                width={1200}
                height={630}
                className="h-auto w-full object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 768px"
              />
            </div>
          </div>
        )}

        {/* Body */}
        <div className="px-5 py-10 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <BlogContentRenderer blocks={post.content} />

            {post.tags && post.tags.length > 0 && (
              <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-6">
                <span className="mr-1 text-sm font-semibold text-gray-500">Tags:</span>
                {post.tags.map((tag) => (
                  <TagPill key={tag.id} tag={tag} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Newsletter CTA */}
        <section className="border-t border-gray-100 bg-gradient-to-br from-gray-50 to-white px-5 py-12 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <NewsletterSubscribeForm variant="banner" className="mx-auto max-w-xl text-center" />
          </div>
        </section>
      </article>

      <RelatedPosts posts={relatedPosts} />
    </>
  );
}
