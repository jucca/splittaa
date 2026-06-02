import type { NextConfig } from "next";
import { convexHttpToWebSocketOrigin } from "./lib/config/convex-connect";

const clerkDomain = process.env.CLERK_JWT_ISSUER_DOMAIN
  ? new URL(process.env.CLERK_JWT_ISSUER_DOMAIN).origin
  : "https://*.clerk.accounts.dev";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? "https://*.convex.cloud";
const convexWs = process.env.NEXT_PUBLIC_CONVEX_URL
  ? convexHttpToWebSocketOrigin(process.env.NEXT_PUBLIC_CONVEX_URL)
  : "wss://*.convex.cloud";

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev",
  "style-src 'self' 'unsafe-inline'",
  `connect-src 'self' ${convexUrl} ${convexWs} ${clerkDomain} https://*.clerk.accounts.dev`,
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "frame-src 'self' https://*.clerk.accounts.dev",
  "worker-src 'self' blob:",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy-Report-Only",
    value: contentSecurityPolicy,
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
