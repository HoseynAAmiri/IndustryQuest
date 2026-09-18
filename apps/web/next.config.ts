import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  transpilePackages: ["@iq/core", "@iq/db"],
};

export default nextConfig;

initOpenNextCloudflareForDev();
