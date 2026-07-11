import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bee Vibe | Premium Mini Private Theater & Celebration Space",
  description: "Book a luxury mini private theater for birthdays, anniversaries, romantic date nights, or multiplayer gaming. Enjoy 180-inch 4K screens, Dolby Atmos surround sound, custom theme decorations, gourmet snacks, and interactive mood lighting.",
  keywords: ["private theater", "birthday celebration space", "private cinema", "date night private theater", "gaming theater", "mini theater booking"],
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

