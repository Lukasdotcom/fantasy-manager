const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.APP_ENV !== "production",
});

/** @type {import('next').NextConfig} */
const nextConfig = withPWA({
  reactStrictMode: true,
  images: {
    domains: [
      "i.bundesliga.com",
      "resources.premierleague.com",
      "play.fifa.com",
      "raw.githubusercontent.com",
    ],
  },
});

module.exports = nextConfig;
