import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async redirects() {
    return [
      { source: "/markets", destination: "/", permanent: true },
      {
        source: "/markets/:path*",
        destination: "/market/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
