import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bee Vibe Private Celebration Theater",
    short_name: "Bee Vibe",
    description: "Luxury private celebration theater and space in Jayanagar, Bangalore.",
    start_url: "/",
    display: "standalone",
    background_color: "#0c0a09",
    theme_color: "#f7cd48",
    icons: [
      {
        src: "/gold-camera-logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/gold-camera-logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
