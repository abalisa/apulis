/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Enable compression for better performance
  compress: true,
  // Optimize production builds
  productionBrowserSourceMaps: false,
  // Cache strategy for API routes
  onDemandEntries: {
    maxInactiveAge: 60 * 1000, // 60 seconds
    pagesBufferLength: 10,
  },
}

export default nextConfig
