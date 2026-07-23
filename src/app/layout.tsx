import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bee Vibe | Luxury Mini Private Theater & Celebration Space",
  description: "Book a luxury mini private theater for birthdays, anniversaries, romantic date nights, or multiplayer gaming. Enjoy 180-inch 4K screens, Dolby Atmos surround sound, custom theme decorations, gourmet food service, and interactive mood lighting.",
  keywords: ["private theater", "birthday celebration space", "private cinema", "date night private theater", "gaming theater", "mini theater booking"],
  openGraph: {
    title: "Bee Vibe | Luxury Mini Private Theater & Celebration Space",
    description: "Book a luxury mini private theater for birthdays, anniversaries, romantic date nights, or multiplayer gaming. Enjoy 180-inch 4K screens, Dolby Atmos surround sound, and custom mood lighting.",
    images: [{ url: "/gold-camera-logo.png", width: 800, height: 800, alt: "Bee Vibe Private Theater" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bee Vibe | Luxury Mini Private Theater & Celebration Space",
    description: "Book a luxury mini private theater for birthdays, anniversaries, romantic date nights, or multiplayer gaming.",
    images: ["/gold-camera-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}

