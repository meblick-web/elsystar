import type { NextConfig } from "next";

const codespaceName = process.env.CODESPACE_NAME?.trim();
const forwardingDomain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN?.trim() || "app.github.dev";
const exactCodespacesOrigin = codespaceName ? `${codespaceName}-6300.${forwardingDomain}` : null;

const allowedOrigins = [
  ...(exactCodespacesOrigin ? [exactCodespacesOrigin] : []),
  "*.app.github.dev",
  "**.app.github.dev",
];

const nextConfig: NextConfig = {
  allowedDevOrigins: allowedOrigins,
  experimental: {
    serverActions: {
      allowedOrigins,
    },
  },
};

export default nextConfig;
