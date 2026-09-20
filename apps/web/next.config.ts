import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  transpilePackages: ["@iq/core", "@iq/db"],
  // Phone testing over a cloudflared tunnel: without this, dev blocks /_next/hmr from the tunnel
  // host and the HMR client reload-loops the page, so nothing ever hydrates.
  allowedDevOrigins: ["*.trycloudflare.com"],
  // pg picks its Cloudflare socket through a "workerd" export condition that Next's tracer skips.
  outputFileTracingIncludes: { "/*": ["../../node_modules/.pnpm/pg-cloudflare@*/node_modules/pg-cloudflare/**"] },
};

export default nextConfig;

initOpenNextCloudflareForDev();
