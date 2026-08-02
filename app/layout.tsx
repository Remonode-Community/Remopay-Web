import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/Providers";

// Using system fonts instead of Google Fonts to avoid network dependency during build

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://remopay.remonode.com";

export const metadata: Metadata = {
  title: "Remopay - Digital Finance Platform | USD Accounts, Virtual Cards & Bill Payments",
  description: "Remopay is a modern digital finance platform with USD accounts, virtual dollar cards, money transfers, bill payments, airtime conversion, and VTU services. Secure international payments for freelancers, remote workers, and businesses.",
  keywords: "digital finance platform, USD account, virtual dollar card, international payments, online payments, money transfer, bill payments, airtime to cash, virtual top-up, digital wallet, fintech, financial services, cross-border payments, dollar banking, payment solutions, virtual card, freelance payments, remote worker payments, VTU, data bundles, airtime, MTN, Airtel, Glo, 9mobile",
  authors: [{ name: "Remopay" }],
  creator: "Remopay",
  publisher: "Remopay",
  robots: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
  metadataBase: new URL("https://remopay.remonode.com"),
  alternates: {
    canonical: "https://remopay.remonode.com",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      {
        url: "/icon.png?v=2",
        sizes: "any",
        type: "image/png",
      },
      {
        url: "/icon.png?v=2",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icon.png?v=2",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    apple: {
      url: "/icon.png?v=2",
      sizes: "180x180",
      type: "image/png",
    },
    shortcut: "/icon.png?v=2",
  },
  openGraph: {
    type: "website",
    url: "https://remopay.remonode.com",
    title: "Remopay - Your All-in-One Digital Finance Solution",
    description: "Secure USD accounts, virtual dollar cards, international payments, money transfers, bill payments, and airtime conversion - all in one platform.",
    siteName: "Remopay",
    images: [
      {
        url: `${SITE_URL}/remopay-banner.png`,
        width: 800,
        height: 420,
        alt: "Remopay - Digital Finance Platform",
        type: "image/png",
      },
    ],
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: "Remopay - Your all-in-one payment solution",
    description: "Make Payment, Virtual Dollar Card and Virtual Top Up Services (Data | Airtime | Electricity | TV Subscription)",
    images: ["https://remopay.remonode.com/remopay-banner.png"],
    creator: "@Remopay",
    site: "@Remopay",
  },
  category: "Technology",
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Remopay",
    url: "https://remopay.remonode.com",
    logo: "https://remopay.remonode.com/icon.png",
    description: "Remopay is a modern digital finance platform that empowers individuals and businesses with secure USD accounts, virtual dollar cards, seamless money transfers, and everyday payment solutions.",
    sameAs: [
      "https://www.facebook.com/RemonodeTech/",
      "https://www.twitter.com/RemonodeTech",
      "https://www.instagram.com/RemonodeTech",
      "https://www.linkedin.com/company/remonode",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Support",
      email: "support@remonode.com",
      availableLanguage: ["en"],
      telephone: "+234-xxx-xxxx",
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "NG",
    },
    foundingDate: "2024",
    areaServed: "NG",
    knowsAbout: [
      "Digital Finance",
      "Online Payments",
      "International Money Transfers",
      "Virtual Dollar Cards",
      "USD Banking",
      "Bill Payments",
      "Virtual Top-Up Services",
      "Airtime to Cash Conversion",
      "Financial Services",
      "Fintech",
    ],
    offers: [
      {
        "@type": "Service",
        name: "USD Accounts",
        description: "Receive, hold, and manage US Dollar payments conveniently from clients, businesses, and international platforms.",
      },
      {
        "@type": "Service",
        name: "Virtual Dollar Cards",
        description: "Secure virtual USD cards for international online payments, subscriptions, advertising, e-commerce, and global transactions.",
      },
      {
        "@type": "Service",
        name: "Virtual Top-Up Services",
        description: "Buy airtime, mobile data, electricity tokens, TV subscriptions, examination pins, and more at competitive rates.",
      },
      {
        "@type": "Service",
        name: "Airtime to Cash Conversion",
        description: "Instantly convert excess airtime into cash directly within the platform.",
      },
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Remopay",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/blog?search={search_term_string}`,
      },
      query: "required name=search_term_string",
    },
    description: "Digital Finance Platform - USD Accounts, Virtual Cards & Bill Payments",
  };

  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <head>
        {/* JSON-LD Structured Data (inlined so crawlers/AI that don't run JS can read it) */}
        <script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          id="website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />

        {/* Additional Meta Tags */}
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="ie=edge" />
        <meta name="theme-color" content="#620707" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Remopay" />
        <meta name="msapplication-TileColor" content="#620707" />
        <meta name="msapplication-TileImage" content="/icon.png" />

        {/* DNS Prefetch - critical origins only */}
        <link rel="dns-prefetch" href="https://api.remopay.remonode.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />

        {/* Preconnect to image origin */}
        <link rel="preconnect" href="https://api.remopay.remonode.com" />

        {/* Google Analytics 4 - lazy loaded to avoid blocking render */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-L0LS146KZG"
          strategy="lazyOnload"
        />
        <Script
          id="google-analytics-init"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-L0LS146KZG', {
                'page_path': window.location.pathname,
                'page_title': document.title,
                'anonymize_ip': true,
                'allow_google_signals': false,
                'allow_ad_personalization_signals': false,
                'send_page_view': true,
                'cookie_flags': 'SameSite=None;Secure'
              });
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-gray-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
