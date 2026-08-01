import { MetadataRoute } from 'next';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://gateway.remonode.com/remopay/api/v1';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://remopay.remonode.com';
  const lastModified = new Date();

  // Main pages with highest priority
  const mainPages = [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/multi-currency`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    },
  ];

  // Service feature pages - high priority for SEO
  const serviceFeaturePages = [
    {
      url: `${baseUrl}/services/usd-accounts`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/services/virtual-dollar-cards`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/services/virtual-topup`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/services/airtime-to-cash`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/services/money-transfer`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/services/bill-payments`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/services/international-payments`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ];

  // VTU pages - high priority
  const vtuPages = [
    {
      url: `${baseUrl}/vtu`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/vtu/airtime`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/vtu/data`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/vtu/tv`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    },
    {
      url: `${baseUrl}/vtu/bills`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    },
  ];

  // Informational pages - medium priority
  const infoPages = [
    {
      url: `${baseUrl}/faq`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    },
    {
      url: `${baseUrl}/support`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
  ];

  // Auth pages - lower priority (users need to login/signup)
  const authPages = [
    {
      url: `${baseUrl}/auth/login`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/auth/register`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.7, // Higher priority for signup to improve conversions
    },
    {
      url: `${baseUrl}/auth/forgot-password`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    },
  ];

  // Blog pages - medium priority, dynamic post slugs fetched from the public API
  const blogPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/blog`,
      lastModified,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
  ];

  try {
    const res = await fetch(`${API_BASE_URL}/public/blog/posts?per_page=100`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (res.ok) {
      const json = (await res.json()) as {
        data?: { items?: Array<{ slug: string; updated_at?: string }> };
      };
      const items = json.data?.items || [];
      items.forEach((post) => {
        blogPages.push({
          url: `${baseUrl}/blog/${post.slug}`,
          lastModified: post.updated_at ? new Date(post.updated_at) : lastModified,
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        });
      });
    }
  } catch {
    // API unavailable — still publish the static blog entry.
  }

  // Combine all public pages - EXCLUDE dashboard, admin, agent pages
  return [...mainPages, ...serviceFeaturePages, ...vtuPages, ...infoPages, ...blogPages, ...authPages];
}
