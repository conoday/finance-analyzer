/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  },
  // In production on Vercel, proxy /proxy-api/* to the FastAPI backend on Render.
  // The frontend lib/api.ts uses NEXT_PUBLIC_API_URL directly, so no change needed there.
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!backendUrl || backendUrl.startsWith("http://localhost")) return [];
    return [
      {
        source: "/proxy-api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
    ],
  },
};

export default nextConfig;
