const withPWA = require("next-pwa");

/** @type {import('next').NextConfig} */
const nextConfig = withPWA({
  reactStrictMode: true,
  images: {
    domains: ["i.bundesliga.com"],
  },
  pwa: {
    dest: "public",
    disable: process.env.NODE_ENV !== "production",
  },
});

module.exports = nextConfig;
