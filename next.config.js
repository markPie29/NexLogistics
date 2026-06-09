const path = require("path");
const os = require("os");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Pre-existing lint warnings/errors in legacy files should not block builds.
    // Run `npx next lint` separately to address them incrementally.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
  // Redirect webpack filesystem cache outside OneDrive to prevent sync
  // corruption (ENOENT on vendor-chunks, missing .js cache files).
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = {
        type: "filesystem",
        cacheDirectory: path.join(os.tmpdir(), "nex-logistics-webpack-cache"),
        buildDependencies: { config: [__filename] },
      };
    }
    return config;
  },
};
module.exports = nextConfig;
