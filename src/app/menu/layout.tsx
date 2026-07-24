import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.beevibe.org";

export const metadata: Metadata = {
  title: "In-Theater Gourmet Menu & Snacks | Bee Vibe Cafe Jayanagar",
  description: "Browse fresh popcorn, nachos, mocktails, milkshakes, and hot appetizers available for private room service during your theater session at Bee Vibe Bangalore.",
  keywords: [
    "private theater food menu",
    "bee vibe cafe",
    "in-theater snacks bangalore",
    "theater room service jayanagar",
    "private theater drinks menu"
  ],
  alternates: {
    canonical: `${siteUrl}/menu`,
  },
  openGraph: {
    title: "In-Theater Gourmet Menu | Bee Vibe Cafe",
    description: "Order fresh popcorn, nachos, mocktails, and snacks directly to your private theater room at Bee Vibe Bangalore.",
    url: `${siteUrl}/menu`,
    siteName: "Bee Vibe Private Celebration Theater",
    images: [
      {
        url: "/gold-camera-logo.png",
        width: 800,
        height: 800,
        alt: "Bee Vibe Gourmet Cafe Menu",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "In-Theater Gourmet Menu | Bee Vibe Cafe",
    description: "Order fresh popcorn, nachos, mocktails, and snacks directly to your private theater room at Bee Vibe Bangalore.",
    images: ["/gold-camera-logo.png"],
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
      "name": "Cafe Menu",
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
