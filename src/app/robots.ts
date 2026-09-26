import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "OAI-SearchBot", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },
      { userAgent: "*", allow: "/", disallow: ["/*?*brand=", "/*?*room=", "/*?*material=", "/*?*color=", "/*?*f_", "/*?*availability=", "/*?*sort="] },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
