import type { NextConfig } from "next";
import { LEGACY_REDIRECTS } from "./src/constants/routes";

/** En-têtes de sécurité : pas d'intégration dans une iframe, pas de détection de type, moins de fuite d'URL. */
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()" },
];

const nextConfig: NextConfig = {
  // La pastille « N » du mode dev masquait le premier onglet de la barre mobile ; les erreurs restent affichées.
  devIndicators: false,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
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
