import { execFileSync } from "node:child_process";

const payloadBin = "node_modules/payload/bin.js";
const tests = [
  ["domain", "src/payload/verify-domain.ts"],
  ["cart", "src/payload/verify-cart.ts"],
  ["storefront cart", "src/payload/verify-storefront-cart.ts"],
  ["orders", "src/payload/verify-orders.ts"],
  ["authentication", "src/payload/verify-auth.ts"],
  ["payments", "src/payload/verify-payments.ts"],
  ["shipping", "src/payload/verify-shipping.ts"],
  ["catalog", "src/payload/verify-unified-catalog.ts"],
  ["catalog scalability", "src/payload/verify-catalog-scalability.ts"],
  ["catalog filters", "src/payload/verify-catalog-filters.ts"],
  ["curated catalog", "src/payload/verify-manual-catalog.ts"],
  ["content", "src/payload/verify-content.ts"],
  ["optional import media", "src/payload/verify-optional-import-images.ts"],
  ["storefront revalidation", "src/payload/verify-storefront-revalidation.ts"],
  ["jobs authorization", "src/payload/verify-jobs-cron.ts"],
];

for (const [name, file] of tests) {
  console.info("\nRunning " + name + " regression...");
  execFileSync(process.execPath, [payloadBin, "run", file], { stdio: "inherit" });
}
