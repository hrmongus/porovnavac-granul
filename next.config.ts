import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // docs/METODIKA.md sa číta pri zostavení stránky Metodika
  outputFileTracingIncludes: { "/metodika": ["./docs/METODIKA.md"] },
};

export default nextConfig;
