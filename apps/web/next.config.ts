import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  async rewrites() {
    return [
      // Mintlify /docs rewrites so to be in useagents.site/docs
      {
        source: "/docs",
        destination: "https://useagents-66bd89b2.mintlify.dev/docs",
      },
      {
        source: "/docs/:match*",
        destination: "https://useagents-66bd89b2.mintlify.dev/docs/:match*",
      },
    ];
  },
};

export default nextConfig;
