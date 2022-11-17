const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.APP_ENV !== "production",
});
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = withPWA(
  withBundleAnalyzer({
    reactStrictMode: true,
    images: {
      domains: [
        "i.bundesliga.com",
        "resources.premierleague.com",
        "play.fifa.com",
      ],
    },
  })
);

module.exports = nextConfig;
