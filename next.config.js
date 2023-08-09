const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.APP_ENV !== "production",
});

/** @type {import('next').NextConfig} */
const nextConfig = withPWA({
  reactStrictMode: true,
  images: {
    domains: ["raw.githubusercontent.com"],
  },
  i18n: {
    locales: ["en", "de"],
    defaultLocale: "en",
  },
});

module.exports = nextConfig;
