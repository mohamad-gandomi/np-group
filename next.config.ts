import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // The CLI checker spawns a detached process, which is unavailable in some
    // restricted build environments. The compiler API performs the same check.
    useTypeScriptCli: false,
  },
};

export default nextConfig;
