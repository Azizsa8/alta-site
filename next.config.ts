import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // There is a stray package-lock.json in the parent directory, which makes
  // Turbopack infer the wrong workspace root. Pin it explicitly.
  turbopack: { root: path.resolve(process.cwd()) },

  images: {
    // Agents may point the hero/about images at an external URL. Those render
    // with `unoptimized`, so no remote host needs allow-listing here; keeping
    // the list empty means the optimiser can never be pointed at an arbitrary
    // host as an SSRF-ish proxy.
    remotePatterns: [],
  },

  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
