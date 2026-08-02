import { MetadataRoute } from 'next';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://gateway.remonode.com/remopay/api/v1';
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://remopay.remonode.com';

/** Fetch a public API JSON payload with ISR revalidation (1h). */
async function fetchJson(path: string): Promise<{ data?: any } | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as { data?: any };
  } catch {
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const entries: MetadataRoute.Sitemap = [];

  // ── Main pages (highest priority) ──────────────────────────────────────
  const mainPages = [
    { url: `${baseUrl}`, changeFrequency: 'weekly' as const, priority: 1.0 },
    { url: `${baseUrl}/about`, changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/faq`, changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${baseUrl}/careers`, changeFrequency: 'weekly' as const, priority: 0.6 },
    { url: `${baseUrl}/support`, changeFrequency: 'weekly' as const, priority: 0.6 },
    { url: `${baseUrl}/multi-currency`, changeFrequency: 'weekly' as const, priority: 0.8 },
  ];
  mainPages.forEach((p) => entries.push({ ...p, lastModified }));

  // ── VTU service pages ──────────────────────────────────────────────────
  const vtuPages = [
    { url: `${baseUrl}/vtu`, changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${baseUrl}/vtu/airtime`, changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${baseUrl}/vtu/data`, changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${baseUrl}/vtu/tv`, changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${baseUrl}/vtu/bills`, changeFrequency: 'weekly' as const, priority: 0.8 },
  ];
  vtuPages.forEach((p) => entries.push({ ...p, lastModified }));

  // ── Legal/informational ────────────────────────────────────────────────
  const infoPages = [
    { url: `${baseUrl}/privacy`, changeFrequency: 'monthly' as const, priority: 0.4 },
    { url: `${baseUrl}/terms`, changeFrequency: 'monthly' as const, priority: 0.4 },
  ];
  infoPages.forEach((p) => entries.push({ ...p, lastModified }));

  // ── Conversion entry page ──────────────────────────────────────────────
  entries.push({
    url: `${baseUrl}/auth/register`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.5,
  });

  // ── Blog ───────────────────────────────────────────────────────────────
  entries.push({
    url: `${baseUrl}/blog`,
    lastModified,
    changeFrequency: 'daily',
    priority: 0.8,
  });

  // Every published post (paginate so we never cap at a single page of results).
  const perPage = 100;
  let page = 1;
  let safety = 0;
  while (safety < 50) {
    const json = await fetchJson(`/public/blog/posts?per_page=${perPage}&page=${page}`);
    const items: Array<{ slug: string; updated_at?: string }> = json?.data?.items || [];
    const total = Number(json?.data?.pagination?.total) || 0;
    if (items.length === 0) break;
    items.forEach((post) => {
      entries.push({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: post.updated_at ? new Date(post.updated_at) : lastModified,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    });
    if (page * perPage >= total) break;
    page += 1;
    safety += 1;
  }

  // Category index pages
  const catJson = await fetchJson('/public/blog/categories');
  const categories: Array<{ slug: string }> = catJson?.data?.items || [];
  categories.forEach((cat) => {
    if (!cat?.slug) return;
    entries.push({
      url: `${baseUrl}/blog/category/${cat.slug}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.5,
    });
  });

  // Tag index pages
  const tagJson = await fetchJson('/public/blog/tags');
  const tags: Array<{ slug: string }> = tagJson?.data?.items || [];
  tags.forEach((tag) => {
    if (!tag?.slug) return;
    entries.push({
      url: `${baseUrl}/blog/tag/${tag.slug}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.4,
    });
  });

  // Only public pages — admin, agent, dashboard, wallet, settings, API and
  // auth flows are intentionally excluded.
  return entries;
}
