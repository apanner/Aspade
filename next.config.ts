
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use standalone output for Docker deployment on Fly.io, regular build for Oracle
  output: process.env.DEPLOY_TARGET === 'flyio' ? 'standalone' : 
          process.env.DEPLOY_TARGET === 'cpanel' ? 'export' : 
          process.env.DEPLOY_TARGET === 'oracle' ? undefined : 'export',
  
  // Configure basePath based on deployment target
  basePath: process.env.DEPLOY_TARGET === 'cpanel' ? '/game' : undefined,
  assetPrefix: process.env.DEPLOY_TARGET === 'cpanel' ? '/game' : undefined,
  
  images: {
    unoptimized: true
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://www.apanner.com',
    NEXT_PUBLIC_BASE_PATH: process.env.DEPLOY_TARGET === 'cpanel' ? '/game' : '',
  },
  trailingSlash: process.env.DEPLOY_TARGET === 'cpanel' ? true : false,
};

export default nextConfig;
