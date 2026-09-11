import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  experimental: {
    // The CLI checker spawns a detached process, which is unavailable in some
    // restricted build environments. The compiler API performs the same check.
    useTypeScriptCli: false,
    // Multiple root layouts need the routing-level 404 convention so unknown
    // storefront and Payload URLs receive the same localized recovery page.
    globalNotFound: true,
  },
};

export default withPayload(nextConfig);
