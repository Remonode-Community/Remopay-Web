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
import { EngagementSidebar } from '@/components/blog/engagement/EngagementSidebar';
import { ArticleLikeButton } from '@/components/blog/engagement/ArticleLikeButton';
import { ShareButtons } from '@/components/blog/ShareButtons';
import BlogReader from '@/components/blog/BlogReader';
import { formatDate } from '@/utils/format.utils';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://remopay.remonode.com';

/** Ensure an asset/path is an absolute URL for social/structured data. */
const absoluteUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) return `${SITE_URL}${url}`;
  return url;
};

/** Approximate word count of the article body (strips HTML, supports legacy blocks). */
function computeWordCount(content: string | unknown[] | null | undefined): number {
  if (typeof content === 'string') {
    const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return text ? text.split(' ').length : 0;
  }
  if (Array.isArray(content)) {
    return content.reduce<number>((acc, block) => {
      const data = (block as { data?: Record<string, unknown> })?.data ?? {};
      const text = [data.text, data.content, data.caption, data.title, data.code, data.table]
        .filter((v): v is string => typeof v === 'string')
        .join(' ');
      return acc + text.split(/\s+/).filter(Boolean).length;
    }, 0);
  }
  return 0;
}

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
  const keywords = post.seo?.keywords || post.seo_keywords?.join(', ') || undefined;
  const canonical =
    absoluteUrl(post.canonical_url || post.seo?.canonical_url || post.url) ||
    `${SITE_URL}/blog/${slug}`;
  const image = absoluteUrl(post.cover_image || post.featured_image);
  const section = post.categories?.[0]?.name;
  const tags = post.tags?.map((t) => t.name) || [];
  const authorName = post.author
    ? `${post.author.first_name} ${post.author.last_name}`
    : 'Remopay Team';
  const og = (post.seo?.og_meta || {}) as Record<string, unknown>;
  const twitter = (post.seo?.twitter_meta || {}) as Record<string, unknown>;

  return {
    title,
    description,
    keywords: keywords || undefined,
    alternates: { canonical },
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
    authors: [{ name: authorName }],
    category: section,
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonical,
      siteName: 'Remopay',
      locale: 'en_NG',
      publishedTime: post.published_at || undefined,
      modifiedTime: post.updated_at || undefined,
      authors: [authorName],
      ...(section ? { section } : {}),
      tags,
      images: image ? [{ url: image, width: 1200, height: 630, alt: title }] : undefined,
      ...og,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      site: '@Remopay',
      creator: '@Remopay',
      images: image ? [image] : undefined,
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

  const coverAbs = absoluteUrl(cover);
  const canonical =
    absoluteUrl(post.canonical_url || post.seo?.canonical_url || post.url) ||
    `${SITE_URL}/blog/${slug}`;
  const authorName = post.author
    ? `${post.author.first_name} ${post.author.last_name}`
    : 'Remopay Team';
  const section = post.categories?.[0]?.name;
  const tags = post.tags?.map((t) => t.name) || [];
  const readMinutes = Math.max(1, post.read_time || 1);

  // Complete Article schema — merge backend-provided JSON-LD (if any) with our
  // guaranteed fields so rich results & AI engines always get full metadata.
  const baseArticle =
    jsonLd?.article && typeof jsonLd.article === 'object'
      ? (jsonLd.article as Record<string, unknown>)
      : {};
  const articleSchema: Record<string, unknown> = {
    ...baseArticle,
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': canonical,
    headline: post.title,
    description: post.seo?.description || post.summary || undefined,
    image: coverAbs ? [coverAbs] : undefined,
    datePublished: post.published_at || undefined,
    dateModified: post.updated_at || undefined,
    author: { '@type': 'Person', name: authorName },
    publisher: {
      '@type': 'Organization',
      name: 'Remopay',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    url: canonical,
    inLanguage: 'en',
    timeRequired: `PT${readMinutes}M`,
    wordCount: computeWordCount(post.content),
    isAccessibleForFree: true,
    ...(section ? { articleSection: section } : {}),
    ...(tags.length ? { keywords: tags.join(', ') } : {}),
  };

  const crumbItems: Record<string, unknown>[] = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
  ];
  if (section && post.categories?.[0]?.slug) {
    crumbItems.push({
      '@type': 'ListItem',
      position: 3,
      name: section,
      item: `${SITE_URL}/blog/category/${post.categories[0].slug}`,
    });
  }
  crumbItems.push({
    '@type': 'ListItem',
    position: crumbItems.length + 1,
    name: post.title,
    item: canonical,
  });
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbItems,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

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
                <time dateTime={post.published_at} className="flex items-center gap-1.5">
                  <CalendarDays size={15} /> {formatDate(post.published_at)}
                </time>
              )}
              <span className="flex items-center gap-1.5">
                <Clock size={15} /> {post.read_time || 1} min read
              </span>
              <span className="flex items-center gap-1.5">
                <Eye size={15} /> {post.view_count?.toLocaleString?.() ?? 0} views
              </span>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <ArticleLikeButton
                slug={post.slug}
                initialLiked={false}
                initialCount={post.like_count ?? 0}
              />
              <ShareButtons title={post.title} slug={post.slug} />
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

        {/* Body — two-column on desktop (article left, engagement sidebar right) */}
        <div className="px-5 py-10 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
            {/* Left column: article content */}
            <div className="min-w-0 max-w-3xl">
              <BlogReader
                title={post.title}
                contentHtml={post.content_html ?? undefined}
                content={Array.isArray(post.content) ? post.content : undefined}
              />
              {post.content_html ? (
                /* Strategy A (recommended): inject backend-sanitized HTML.
                   The backend wraps it in <div class="blog-content"> and the
                   shared stylesheet handles typography/spacing/rhythm. */
                <div dangerouslySetInnerHTML={{ __html: post.content_html }} />
              ) : Array.isArray(post.content) ? (
                /* Strategy B (legacy JSON-block articles): same renderer used in
                   the admin editor preview for a WYSIWYG match. */
                <BlogContentRenderer blocks={post.content} />
              ) : (
                /* Fallback: raw HTML string without a server wrapper. */
                <div
                  className="blog-content"
                  dangerouslySetInnerHTML={{ __html: post.content || '' }}
                />
              )}

              {post.tags && post.tags.length > 0 && (
                <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-6">
                  <span className="mr-1 text-sm font-semibold text-gray-500">Tags:</span>
                  {post.tags.map((tag) => (
                    <TagPill key={tag.id} tag={tag} />
                  ))}
                </div>
              )}
            </div>

            {/* Right column: engagement (ratings, reviews, comments, newsletter) */}
            <aside className="min-w-0 lg:pt-1">
              <div className="lg:sticky lg:top-24">
                <EngagementSidebar slug={post.slug} />
              </div>
            </aside>
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
