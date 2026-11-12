import type { MetadataRoute } from "next";
import { ROLES } from "@/lib/careers/roles";
import { PUBLIC_PATHS, SITE_URL } from "@/lib/site";

/**
 * /sitemap.xml: the list of public pages, so search engines find every one (including each job's
 * details and application pages). Next.js turns this into the standard XML format.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    ...PUBLIC_PATHS,
    ...ROLES.flatMap((r) => [`/careers/jobs/${r.slug}`, `/careers/apply/${r.slug}`]),
  ];
  return pages.map((path) => ({
    url: new URL(path, SITE_URL).href,
    changeFrequency: path === "/" || path === "/careers" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.6,
  }));
}
