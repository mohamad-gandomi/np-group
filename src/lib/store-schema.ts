import { siteConfig } from "@/config/site";

export const storeSchema = {
  "@type": "FurnitureStore",
  "@id": new URL("/#store", siteConfig.url).href,
  name: siteConfig.storeName,
  url: new URL("/contact", siteConfig.url).href,
  telephone: siteConfig.phoneNumber,
  address: { "@type": "PostalAddress", streetAddress: siteConfig.streetAddress, addressLocality: siteConfig.city, addressRegion: siteConfig.region, addressCountry: "IR" },
  geo: { "@type": "GeoCoordinates", ...siteConfig.coordinates },
  hasMap: siteConfig.mapsUrl,
  openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], ...siteConfig.openingHours }],
};
