import type { NextConfig } from "next";
import { API_ORIGIN } from "./src/lib/api-origin";

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
  // The browser talks to the Java API through the website's own address: /api/auth/* is forwarded
  // to Spring. So the login cookie is first-party, HttpOnly and never needs cross-site (CORS) rules.
  // (The other /api/* routes are still the website's own until the dashboard moves to the Java API.)
  async rewrites() {
    return [{ source: "/api/auth/:path*", destination: `${API_ORIGIN}/api/auth/:path*` }];
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
