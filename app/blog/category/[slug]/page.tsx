import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchCategoryPosts, fetchPublicCategories } from '@/lib/blog-server';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { BlogBreadcrumbs } from '@/components/blog/BlogBreadcrumbs';
import { NewsletterSubscribeForm } from '@/components/blog/NewsletterSubscribeForm';
import { BlogPagination } from '@/components/blog/BlogPagination';
import { CategoryPill } from '@/components/blog/CategoryPill';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://remopay.remonode.com';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateStaticParams() {
  const categories = await fetchPublicCategories();
  return (categories ?? []).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchCategoryPosts(slug, 1);
  const category = data?.category;
  const name = category?.name || slug;
  const canonical = `${SITE_URL}/blog/category/${slug}`;
  const description =
    category?.description || `Articles in the ${name} category on the Remopay Blog.`;
  const title = `${name} articles | Remopay Blog`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true, 'max-image-preview': 'large' },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
      siteName: 'Remopay',
      locale: 'en_NG',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function CategoryPostsPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || '1', 10) || 1);

  const [data, allCats] = await Promise.all([fetchCategoryPosts(slug, page), fetchPublicCategories()]);
  if (!data) notFound();

  const { category, items: posts } = data;
  const totalPages = data.pagination?.last_page ?? 1;
  const allCategories = allCats ?? [];
  const canonical = `${SITE_URL}/blog/category/${slug}`;
  const categoryName = category?.name || slug;

  const buildHref = (nextPage: number) =>
    nextPage > 1 ? `/blog/category/${slug}?page=${nextPage}` : `/blog/category/${slug}`;

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: categoryName,
    url: canonical,
    ...(category?.description ? { description: category.description } : {}),
    mainEntity: { '@type': 'Blog', name: categoryName, url: canonical },
    ...(posts.length
      ? {
          hasPart: posts.slice(0, 10).map((p) => ({
            '@type': 'BlogPosting',
            headline: p.title,
            url: `${SITE_URL}/blog/${p.slug}`,
            ...(p.summary ? { description: p.summary } : {}),
          })),
        }
      : {}),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: categoryName, item: canonical },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div>
        <div className="border-b border-gray-100 bg-gray-50/50 px-5 py-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <BlogBreadcrumbs
              crumbs={[
                { label: 'Blog', href: '/blog' },
                { label: categoryName },
              ]}
            />
          </div>
        </div>

        <section className="px-5 py-10 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-3xl font-black tracking-tight text-gray-900">{categoryName}</h1>
            {category?.description && (
              <p className="mt-2 max-w-2xl text-gray-600">{category.description}</p>
            )}

            {posts.length === 0 ? (
              <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
                <p className="font-semibold text-gray-700">No articles in this category yet.</p>
              </div>
            ) : (
              <>
                <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {posts.map((post) => (
                    <BlogPostCard key={post.id} post={post} />
                  ))}
                </div>
                <BlogPagination
                  currentPage={page}
                  lastPage={totalPages}
                  buildHref={buildHref}
                  className="mt-10"
                />
              </>
            )}

            {allCategories.length > 0 && (
              <div className="mt-16 border-t border-gray-100 pt-8">
                <h2 className="mb-4 font-bold text-gray-900">Browse all categories</h2>
                <div className="flex flex-wrap gap-2">
                  {allCategories.map((c) => (
                    <CategoryPill key={c.id} category={c} />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-12 max-w-md">
              <NewsletterSubscribeForm source="blog-category" />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
