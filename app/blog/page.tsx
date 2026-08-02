import type { Metadata } from 'next';
import {
  fetchPublicPosts,
  fetchFeaturedPosts,
  fetchLatestPosts,
  fetchPopularPosts,
  fetchPublicCategories,
} from '@/lib/blog-server';
import type { BlogSort } from '@/types/blog.types';
import { BlogListingView } from '@/components/blog/BlogListingView';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://remopay.remonode.com';

const BLOG_DESCRIPTION =
  'Articles, guides and product updates from Remopay — digital finance, USD accounts, virtual cards and bill payments.';

interface PageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    tag?: string;
    sort?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams;
  const search = sp.search?.trim() || '';
  const category = sp.category?.trim() || '';
  const tag = sp.tag?.trim() || '';
  const sort = sp.sort || '';

  let title = 'Blog | Remopay';
  if (search) title = `Search results for "${search}" | Remopay Blog`;
  else if (category) title = `${category} articles | Remopay Blog`;
  else if (tag) title = `${tag} articles | Remopay Blog`;

  // Search & sort produce low-value/near-duplicate views → noindex them.
  const noindex = Boolean(search || sort);

  let canonical = `${SITE_URL}/blog`;
  if (category && !search && !sort) canonical = `${SITE_URL}/blog/category/${category}`;
  else if (tag && !search && !sort) canonical = `${SITE_URL}/blog/tag/${tag}`;
  else if (noindex) {
    const qp = new URLSearchParams();
    if (search) qp.set('search', search);
    if (category) qp.set('category', category);
    if (tag) qp.set('tag', tag);
    if (sort) qp.set('sort', sort);
    canonical = qp.toString() ? `${SITE_URL}/blog?${qp.toString()}` : `${SITE_URL}/blog`;
  } else if (sp.page && sp.page !== '1') {
    canonical = `${SITE_URL}/blog?page=${sp.page}`;
  }

  return {
    title,
    description: BLOG_DESCRIPTION,
    alternates: { canonical },
    robots: noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      title,
      description: BLOG_DESCRIPTION,
      type: 'website',
      url: canonical,
      siteName: 'Remopay',
      locale: 'en_NG',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: BLOG_DESCRIPTION,
    },
  };
}

export default async function BlogPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const search = sp.search?.trim() || '';
  const category = sp.category?.trim() || '';
  const tag = sp.tag?.trim() || '';
  const sort = (sp.sort as BlogSort) || '';
  const page = Math.max(1, parseInt(sp.page || '1', 10) || 1);
  const hasActiveFilter = Boolean(search || category || tag || sort);

  const [list, featured, latest, popular, categories] = await Promise.all([
    fetchPublicPosts(
      {
        search: search || undefined,
        category: category || undefined,
        tag: tag || undefined,
        sort: sort || undefined,
      },
      page
    ),
    fetchFeaturedPosts(),
    fetchLatestPosts(),
    fetchPopularPosts(),
    fetchPublicCategories(),
  ]);

  const posts = list?.items ?? [];
  const totalPages = list?.pagination?.last_page ?? 1;
  const activeCategory = categories?.find((c) => c.slug === category);

  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Remopay Blog',
    url: `${SITE_URL}/blog`,
    description: BLOG_DESCRIPTION,
    publisher: {
      '@type': 'Organization',
      name: 'Remopay',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon.png` },
    },
    blogPost: posts.slice(0, 10).map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: `${SITE_URL}/blog/${p.slug}`,
      ...(p.summary ? { description: p.summary } : {}),
      ...(p.cover_image ? { image: p.cover_image } : {}),
      ...(p.published_at ? { datePublished: p.published_at } : {}),
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <BlogListingView
        search={search}
        category={category}
        tag={tag}
        sort={sort}
        page={page}
        posts={posts}
        totalPages={totalPages}
        featured={featured ?? []}
        latest={latest ?? []}
        popular={popular ?? []}
        categories={categories ?? []}
        activeCategory={activeCategory}
        hasActiveFilter={hasActiveFilter}
      />
    </>
  );
}
