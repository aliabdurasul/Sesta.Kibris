import path from "path";
import type { NextConfig } from "next";

const supabaseHost = process.env["NEXT_PUBLIC_SUPABASE_URL"]
  ? new URL(process.env["NEXT_PUBLIC_SUPABASE_URL"]).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: supabaseHost
    ? { remotePatterns: [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }] }
    : undefined,
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
