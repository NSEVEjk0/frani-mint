/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // The nostr SDK only uses "ws" in Node environments; browsers use native
    // WebSocket. Aliasing keeps webpack from trying to bundle the Node package.
    config.resolve.alias = {
      ...config.resolve.alias,
      ws: path.resolve(__dirname, "src/lib/ws-stub.js"),
    };
    return config;
  },
};

module.exports = nextConfig;
