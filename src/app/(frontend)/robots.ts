import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/*?*brand=", "/*?*room=", "/*?*material=", "/*?*color=", "/*?*availability=", "/*?*sort="] }],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
