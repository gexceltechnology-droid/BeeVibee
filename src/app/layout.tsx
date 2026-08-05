import type { Metadata, Viewport } from "next";
import { Outfit, Plus_Jakarta_Sans, Press_Start_2P, VT323 } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const pressStart2P = Press_Start_2P({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pixel",
  display: "swap",
});

const vt323 = VT323({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-vt323",
  display: "swap",
});

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
    default: "Bee Vibe Party Hall | Private Party Hall & Celebration Space Bangalore",
    template: "%s | Bee Vibe Party Hall",
  },
  description: "Bee Vibe Party Hall is Bangalore's premier luxury private party hall and celebration space in Jayanagar 9th Block. Book mini party halls for birthdays, anniversaries, couple date nights, private movie screenings, or gaming with 180-inch 4K screen & Dolby Atmos sound.",
  keywords: [
    "beevibe party hall",
    "bee vibe party hall",
    "beevibe party hall bangalore",
    "bee vibe party hall bangalore",
    "beevibe party hall jayanagar",
    "bee vibe party hall jayanagar",
    "beevibe",
    "bee vibe",
    "beevibe private theater",
    "bee vibe private theater",
    "private party hall bangalore",
    "party hall in jayanagar",
    "mini party hall bangalore",
    "birthday party hall jayanagar",
    "private celebration theater bangalore",
    "private theater jayanagar",
    "couple private theater bangalore",
    "date night private theater bangalore",
    "bee vibe celebration hall",
    "private screen for birthday bangalore",
    "bee vibe theater"
  ],
  authors: [{ name: "Bee Vibe Party Hall" }],
  creator: "Bee Vibe Party Hall",
  publisher: "Bee Vibe Party Hall",
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
    google: ["bPQWH4Cg2KkOj2GwUycb_OLVhaqUJzyHHQpNEpanMEE", "googleedf3ca6499a78e5c"],
  },
  icons: {
    icon: "/bee-vibe-icon.png?v=3",
    shortcut: "/bee-vibe-icon.png?v=3",
    apple: "/bee-vibe-icon.png?v=3",
  },
  openGraph: {
    title: "Bee Vibe Party Hall | Luxury Private Party Hall & Celebration Space Bangalore",
    description: "Book Bee Vibe Party Hall in Jayanagar, Bangalore for private birthday celebrations, anniversaries, couple date nights, mini party hall events, and private screenings.",
    url: siteUrl,
    siteName: "Bee Vibe Party Hall",
    images: [
      {
        url: "/bee-vibe-logo.png",
        width: 800,
        height: 800,
        alt: "Bee Vibe Party Hall Logo",
      },
      {
        url: "/vibe-pink.png",
        width: 1200,
        height: 630,
        alt: "Bee Vibe Party Hall & Private Theater",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bee Vibe Party Hall | Luxury Private Party Hall & Celebration Space Bangalore",
    description: "Book Bee Vibe Party Hall in Jayanagar, Bangalore for private birthdays, anniversaries, date nights, or multiplayer gaming.",
    images: ["/bee-vibe-logo.png"],
  },
  category: "entertainment",
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": ["EventVenue", "MovieTheater", "LocalBusiness"],
  "@id": `${siteUrl}/#venue`,
  "name": "Bee Vibe Party Hall & Private Celebration Theater",
  "alternateName": [
    "beevibe party hall",
    "bee vibe party hall",
    "Bee Vibe Party Hall",
    "BeeVibe Party Hall",
    "Bee Vibe Party Hall Bangalore",
    "Bee Vibe Party Hall Jayanagar",
    "Bee Vibe",
    "BeeVibe",
    "Bee Vibe Celebration Theater",
    "Bee Vibe Bangalore"
  ],
  "description": "Bee Vibe Party Hall is a luxury private party hall and celebration venue in Jayanagar 9th Block, Bangalore. Perfect for intimate birthday parties, anniversary surprises, romantic date nights, and private movie or gaming screenings.",
  "url": siteUrl,
  "telephone": "+919900106474",
  "priceRange": "₹599 - ₹2999",
  "currenciesAccepted": "INR",
  "paymentAccepted": "UPI, Credit Card, Debit Card, Net Banking, Cash",
  "logo": `${siteUrl}/bee-vibe-logo.png`,
  "image": [
    `${siteUrl}/bee-vibe-logo.png`,
    `${siteUrl}/vibe-pink.png`,
    `${siteUrl}/vibe-purple.png`
  ],
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "1340, 2nd floor, 41st Cross road, 4th gate, opposite to Jain University, Jayanagara 9th Block",
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
  "areaServed": [
    { "@type": "AdministrativeArea", "name": "Jayanagar" },
    { "@type": "AdministrativeArea", "name": "JP Nagar" },
    { "@type": "AdministrativeArea", "name": "BTM Layout" },
    { "@type": "AdministrativeArea", "name": "Koramangala" },
    { "@type": "AdministrativeArea", "name": "Banashankari" },
    { "@type": "AdministrativeArea", "name": "Bangalore" }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "128",
    "bestRating": "5",
    "worstRating": "1"
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
  "hasMap": "https://maps.app.goo.gl/c4TBh9zeaUDJEh7X8",
  "sameAs": [
    "https://www.instagram.com/beevibe_partyhall/"
  ],
  "amenityFeature": [
    { "@type": "LocationFeatureSpecification", "name": "Private Celebration Party Hall", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "180-inch 4K Screen", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Dolby Atmos Surround Sound", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Custom Birthday & Theme Decoration", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Private Recliner Seating", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Gourmet Snack & Beverage Service", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "PS5 & Multiplayer Gaming Setup", "value": true }
  ]
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  "url": siteUrl,
  "name": "Bee Vibe Party Hall",
  "alternateName": ["beevibe party hall", "bee vibe party hall", "BeeVibe Party Hall", "Bee Vibe", "BeeVibe"],
  "publisher": {
    "@id": `${siteUrl}/#venue`
  }
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is Bee Vibe Party Hall?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Bee Vibe Party Hall is Bangalore's premier luxury private party hall and private celebration theater located in Jayanagar 9th Block. We offer customizable mini party halls with 180-inch 4K screens, 7.1 Dolby surround sound, ambient mood lighting, and decoration setups for birthdays, anniversaries, and date nights."
      }
    },
    {
      "@type": "Question",
      "name": "How do I book a private slot at Bee Vibe Party Hall?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You can book directly on our website www.beevibe.org. Choose your theme, select your date and time slot, add optional cake or decoration packages, and complete your reservation instantly."
      }
    },
    {
      "@type": "Question",
      "name": "Where is Bee Vibe Party Hall located in Bangalore?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Bee Vibe Party Hall is located at 1340, 2nd floor, 41st Cross road, 4th gate, opposite to Jain University, Jayanagar 9th Block, Bengaluru, Karnataka 560041."
      }
    },
    {
      "@type": "Question",
      "name": "Can we bring our own movies or gaming consoles to Bee Vibe Party Hall?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! You can stream from your favorite OTT platforms (Netflix, Prime Video, Disney+ Hotstar, YouTube), plug in your own HDMI devices, or connect your PS5/gaming consoles."
      }
    },
    {
      "@type": "Question",
      "name": "How many guests can fit in Bee Vibe Party Hall?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Our private celebration rooms accommodate up to 10 guests, making them ideal for intimate party hall bookings, birthday surprises, family gatherings, or couple date nights."
      }
    },
    {
      "@type": "Question",
      "name": "Are party decorations included in the booking?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Basic ambient lighting and atmospheric room themes are included. Premium balloon arches, LED photo frames, proposal signs, and fog entry can be added during checkout."
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
    <html lang="en" className={`${outfit.variable} ${plusJakartaSans.variable} ${pressStart2P.variable} ${vt323.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        {/* Facebook Meta Pixel Code */}
        <Script
          id="facebook-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window,document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '2275775639850835'); 
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=2275775639850835&ev=PageView&noscript=1"
            alt="facebook-pixel"
          />
        </noscript>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}


