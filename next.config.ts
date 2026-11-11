import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },

  reactStrictMode: false,
  // The dev-only "N" badge sat on top of the website's WhatsApp button
  devIndicators: false,

  // Old page URLs, kept working for bookmarks
  async redirects() {
    return [
      { source: "/pages/admindashboard", destination: "/dashboard", permanent: false },
      { source: "/pages/eventmanagement", destination: "/events", permanent: false },
    ];
  },
};

export default nextConfig;
