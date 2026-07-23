import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.beevibe.org";

export const metadata: Metadata = {
  title: "Book Private Theater & Celebration Room",
  description: "Select your date, preferred room vibe theme, custom cake, and decoration packages to book your private mini theater slot at Bee Vibe Bangalore.",
  keywords: [
    "book private theater bangalore",
    "private cinema slot booking",
    "birthday celebration room booking",
    "bee vibe booking"
  ],
  alternates: {
    canonical: "/book",
  },
  openGraph: {
    title: "Book Private Theater & Celebration Room | Bee Vibe",
    description: "Select your date, preferred room vibe theme, custom cake, and decoration packages to book your private mini theater slot at Bee Vibe Bangalore.",
    url: `${siteUrl}/book`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Book Private Theater & Celebration Room | Bee Vibe",
    description: "Select your date, preferred room vibe theme, custom cake, and decoration packages to book your private mini theater slot.",
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
      "name": "Book Tickets",
      "item": `${siteUrl}/book`
    }
  ]
};

export default function BookLayout({
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
