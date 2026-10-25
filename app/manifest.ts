import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Ditto",
    short_name: "Ditto",
    description: "Find your next yes. Plan something good with your friends.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fff9fa",
    theme_color: "#fff9fa",
    icons: [
      { src: "/brand/official/app-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/official/app-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/official/app-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
