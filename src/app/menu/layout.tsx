import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.beevibe.org";

export const metadata: Metadata = {
  title: "Gourmet Food & Snacks Menu",
  description: "Browse the gourmet menu at Bee Vibe Private Theater. Order popcorn, nachos, mocktails, milkshakes, pizza, and desserts directly to your private theater room.",
  keywords: [
    "bee vibe menu",
    "private theater food bangalore",
    "in theater gourmet snacks",
    "movie theater popcorn and drinks"
  ],
  alternates: {
    canonical: "/menu",
  },
  openGraph: {
    title: "Gourmet Food & Snacks Menu | Bee Vibe Private Theater",
    description: "Browse the gourmet menu at Bee Vibe Private Theater. Order popcorn, nachos, mocktails, milkshakes, pizza, and desserts directly to your private theater room.",
    url: `${siteUrl}/menu`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gourmet Food & Snacks Menu | Bee Vibe Private Theater",
    description: "Browse the gourmet menu at Bee Vibe Private Theater. Order delicious snacks and drinks served straight to your screen.",
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": siteUrl
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Gourmet Menu",
      "item": `${siteUrl}/menu`
    }
  ]
};

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
