const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.APP_ENV !== "production",
});

/** @type {import('next').NextConfig} */
const nextConfig = withPWA({
  reactStrictMode: true,
  i18n: {
    locales: ["en", "de"],
    defaultLocale: "en",
  },
  images: {
    minimumCacheTTL: 60 * 60 * 24 * 365, // There are no dynamic images used here.
  },
});

module.exports = nextConfig;
