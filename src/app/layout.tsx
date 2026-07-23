import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.beevibe.org";

export const viewport: Viewport = {
  themeColor: "#0c0a09",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Bee Vibe | Luxury Mini Private Theater & Celebration Space Bangalore",
    template: "%s | Bee Vibe",
  },
  description: "Book luxury mini private theaters in Jayanagar, Bangalore for birthdays, anniversaries, romantic date nights, or multiplayer gaming. Enjoy 180-inch 4K screens, Dolby Atmos sound, custom decorations, and gourmet snacks.",
  keywords: [
    "private theater bangalore",
    "mini private theater jayanagar",
    "birthday celebration space bangalore",
    "private cinema booking",
    "date night private theater",
    "couple private theater bangalore",
    "gaming theater bangalore",
    "private screen for birthday",
    "bee vibe theater"
  ],
  authors: [{ name: "Bee Vibe" }],
  creator: "Bee Vibe",
  publisher: "Bee Vibe",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "googleedf3ca6499a78e5c",
  },
  openGraph: {
    title: "Bee Vibe | Luxury Mini Private Theater & Celebration Space Bangalore",
    description: "Book luxury mini private theaters in Jayanagar, Bangalore for birthdays, anniversaries, romantic date nights, or multiplayer gaming.",
    url: siteUrl,
    siteName: "Bee Vibe Mini Private Theater",
    images: [
      {
        url: "/gold-camera-logo.png",
        width: 800,
        height: 800,
        alt: "Bee Vibe Private Theater Logo",
      },
      {
        url: "/vibe-pink.png",
        width: 1200,
        height: 630,
        alt: "Bee Vibe Pink Luxury Theater Room",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bee Vibe | Luxury Mini Private Theater Bangalore",
    description: "Book a luxury mini private theater in Jayanagar, Bangalore for birthdays, anniversaries, romantic date nights, or multiplayer gaming.",
    images: ["/gold-camera-logo.png"],
  },
  category: "entertainment",
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "MovieTheater",
  "@id": `${siteUrl}/#theater`,
  "name": "Bee Vibe Mini Private Theater & Celebration Space",
  "alternateName": ["Bee Vibe", "BeeVibe Mini Theater"],
  "description": "Luxury mini private theater and celebration space in Jayanagar, Bangalore. Perfect for birthdays, anniversaries, romantic date nights, and gaming. Features 180-inch 4K screens, Dolby Atmos surround sound, custom decorations, and gourmet snacks.",
  "url": siteUrl,
  "telephone": "+919900106474",
  "priceRange": "₹₹",
  "logo": `${siteUrl}/gold-camera-logo.png`,
  "image": [
    `${siteUrl}/gold-camera-logo.png`,
    `${siteUrl}/vibe-pink.png`,
    `${siteUrl}/vibe-purple.png`
  ],
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "1340, 41st cross road, near Jain University 4th grade, Jayanagar 9th block",
    "addressLocality": "Bangalore",
    "addressRegion": "Karnataka",
    "postalCode": "560041",
    "addressCountry": "IN"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 12.9177,
    "longitude": 77.5912
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
      ],
      "opens": "10:00",
      "closes": "23:30"
    }
  ],
  "sameAs": [
    "https://www.instagram.com/beevibe_partyhall/"
  ],
  "amenityFeature": [
    { "@type": "LocationFeatureSpecification", "name": "180-inch 4K Screen", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Dolby Atmos Surround Sound", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Custom Theme Decoration", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Private Recliner Seating", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Gourmet Snack & Beverage Service", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "PS5 & Multiplayer Gaming Setup", "value": true }
  ]
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How do I book a slot at Bee Vibe?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Choose your preferred vibe theme and date on our website, select an available time slot, add custom decorations or cake options if needed, and confirm your booking instantly."
      }
    },
    {
      "@type": "Question",
      "name": "Can we bring our own movies or gaming consoles?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! You can stream from your favorite OTT platforms (Netflix, Prime Video, Disney+ Hotstar, YouTube), plug in your own HDMI devices, or bring your gaming consoles."
      }
    },
    {
      "@type": "Question",
      "name": "How many guests can fit in a private room?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Our mini private theater rooms comfortably accommodate up to 6 to 10 guests depending on the room theme selected, making them ideal for intimate celebrations or couple date nights."
      }
    },
    {
      "@type": "Question",
      "name": "Are decorations included in the booking?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Basic ambient lighting and atmospheric themes are included. We also offer custom birthday, anniversary, and date night decoration packages with balloons, LED letters, and floral setups during checkout."
      }
    },
    {
      "@type": "Question",
      "name": "Can we order food and beverages inside the theater?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Absolutely! We provide an in-theater gourmet snack menu including popcorn, nachos, mocktails, milkshakes, and hot beverages served directly to your private room."
      }
    },
    {
      "@type": "Question",
      "name": "What is the cancellation and rescheduling policy?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Bookings can be rescheduled up to 24 hours prior to your scheduled time slot. Contact our support team on WhatsApp or phone for immediate assistance."
      }
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}


