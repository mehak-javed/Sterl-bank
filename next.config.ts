import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Server actions accept 1 MB by default; a job application carries a CV of up to 5 MB.
    serverActions: { bodySizeLimit: "6mb" },
  },
  images: {
    // next/image only optimises pictures from hosts listed here (so nobody can use our server to
    // resize images from anywhere). Unsplash's own image CDN, for the "Meet our people" photos.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com", pathname: "/photo-**" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
