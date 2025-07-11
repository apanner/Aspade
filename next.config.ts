
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/game',
  assetPrefix: '/game',
  images: {
    unoptimized: true
  },
  env: {
    NEXT_PUBLIC_API_URL: 'https://www.apanner.com',
    NEXT_PUBLIC_BASE_PATH: '/game',
  },
  trailingSlash: true,
};

export default nextConfig;
