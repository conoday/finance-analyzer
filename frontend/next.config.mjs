import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // When Vercel Root Directory = "frontend", Next.js file tracing must
  // resolve from the repo root so middleware.js.nft.json is generated correctly.
  outputFileTracingRoot: path.join(__dirname, "../"),
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
};

export default nextConfig;
