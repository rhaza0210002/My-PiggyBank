import type { NextConfig } from "next";
import { LEGACY_REDIRECTS } from "./src/constants/routes";

const nextConfig: NextConfig = {
  async redirects() {
    // Anciens chemins (anglais / camelCase) vers le nouveau plan en français.
    return LEGACY_REDIRECTS.map(({ source, destination }) => ({
      source,
      destination,
      permanent: false,
    }));
  },
};

export default nextConfig;
