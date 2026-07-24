import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.beevibe.org";

export const metadata: Metadata = {
  title: "Book Private Celebration Theater | Slots & Packages | Bee Vibe Bangalore",
  description: "Reserve your luxury private celebration theater in Jayanagar, Bangalore. Select custom time slots, celebration themes, balloon decoration packages, and cakes for birthdays, anniversaries, & dates.",
  keywords: [
    "book private theater bangalore",
    "private cinema slot booking",
    "birthday celebration space booking",
    "date night theater booking jayanagar",
    "private celebration theater reservation bangalore"
  ],
  alternates: {
    canonical: `${siteUrl}/book`,
  },
  openGraph: {
    title: "Book Private Celebration Theater | Bee Vibe Bangalore",
    description: "Reserve your luxury private celebration theater in Jayanagar, Bangalore. Choose your time slot, theme, and custom celebration decorations.",
    url: `${siteUrl}/book`,
    siteName: "Bee Vibe Private Celebration Theater",
    images: [
      {
        url: "/vibe-pink.png",
        width: 1200,
        height: 630,
        alt: "Bee Vibe Private Theater Booking",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Book Private Celebration Theater | Bee Vibe Bangalore",
    description: "Reserve your luxury private celebration theater in Jayanagar, Bangalore. Choose your time slot and custom celebration decorations.",
    images: ["/vibe-pink.png"],
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
      "name": "Book Theater",
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
