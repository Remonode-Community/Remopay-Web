import { MetadataRoute } from 'next';

/**
 * robots.txt policy:
 *  - ALL public pages are crawlable by search engines AND AI/LLM crawlers so
 *    our content can be read, cited and recommended by AI engines.
 *  - Only authenticated/private areas (admin, dashboard, wallet, settings,
 *    transactions, API, auth-verification flows) are blocked.
 *  - Blog listing pagination/filter query params (`?page=`, `?search=`, ...)
 *    are NOT blocked so every published article remains reachable via crawl.
 */

const PUBLIC_ALLOW = [
  '/',
  // Blog — always crawlable
  '/blog',
  '/blog/*',
  // Public marketing pages
  '/about',
  '/faq',
  '/careers',
  '/support',
  '/privacy',
  '/terms',
  '/multi-currency',
  // Public auth entry pages
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  // VTU service pages
  '/vtu',
  '/vtu/*',
  '/vtu/airtime',
  '/vtu/data',
  '/vtu/tv',
  '/vtu/bills',
];

const PRIVATE_DISALLOW = [
  // Authenticated user areas — should not be indexed
  '/admin',
  '/admin/*',
  '/agent',
  '/agent/*',
  '/dashboard',
  '/dashboard/*',
  '/wallet',
  '/wallet/*',
  '/settings',
  '/settings/*',
  '/notifications',
  '/notifications/*',
  '/transactions',
  '/transactions/*',

  // Authentication verification flows
  '/auth/verify-email',
  '/auth/verify-phone',
  '/auth/verify-email/*',
  '/auth/verify-phone/*',
  '/auth/otp',
  '/auth/otp/*',

  // Backend/API — never index
  '/api',
  '/api/*',
  '/server',
  '/server/*',
  '/internal',
  '/internal/*',

  // System/temporary files
  '/_next',
  '/_next/*',
  '/static',
  '/static/*',
  '/*.json',
  '/*.xml',
  '/*.js',
  '/success',
  '/error',
  '/callback',
  '/not-found',
  '/offline',
];

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://remopay.remonode.com';

  // AI / LLM crawlers — same public crawl rights as search engines.
  const aiCrawlers = [
    'GPTBot',
    'ChatGPT-User',
    'OAI-SearchBot',
    'PerplexityBot',
    'anthropic-ai',
    'ClaudeBot',
    'Claude-Web',
    'Google-Extended',
    'CCBot',
    'Applebot',
    'Applebot-Extended',
    'Bytespider',
    'cohere-ai',
    'Meta-ExternalAgent',
    'Amazonbot',
    'YouBot',
  ];

  return {
    rules: [
      // ── Main search engines — full public crawl ─────────────────────────
      {
        userAgent: ['Googlebot', 'Bingbot', 'Slurp', 'DuckDuckBot', 'Baiduspider', 'YandexBot'],
        allow: [...PUBLIC_ALLOW],
        disallow: [...PRIVATE_DISALLOW],
        crawlDelay: 1, // Be respectful to server (honored by Yandex)
      },

      // ── AI / LLM crawlers — may read all public pages ───────────────────
      ...aiCrawlers.map((userAgent) => ({
        userAgent,
        allow: [...PUBLIC_ALLOW],
        disallow: [...PRIVATE_DISALLOW],
      })),

      // ── Default for all other user agents ───────────────────────────────
      {
        userAgent: '*',
        allow: [...PUBLIC_ALLOW],
        disallow: [...PRIVATE_DISALLOW],
      },
    ],

    // Sitemap location for search engines
    sitemap: `${baseUrl}/sitemap.xml`,

    // Host canonical domain
    host: baseUrl,
  };
}
