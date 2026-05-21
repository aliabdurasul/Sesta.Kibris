import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async redirects() {
    return [
      { source: "/markets", destination: "/", permanent: false },
      {
        source: "/markets/:path*",
        destination: "/merchants/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
