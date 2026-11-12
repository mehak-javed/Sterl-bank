import type { MetadataRoute } from "next";
import { PRIVATE_PATHS, SITE_URL } from "@/lib/site";

/**
 * /robots.txt: search engines may crawl the public site; personal banking pages and the API are
 * off-limits (a real bank keeps account pages out of search too). Points crawlers at the sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: [...PRIVATE_PATHS] },
    sitemap: new URL("/sitemap.xml", SITE_URL).href,
  };
}
