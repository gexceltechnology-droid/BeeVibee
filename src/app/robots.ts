import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.beevibe.org";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/secret-owner-portal", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
