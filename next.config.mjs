/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ignore pdf-parse test files during build
      config.externals = config.externals || [];
      config.externals.push({
        'fs': 'fs'
      });
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse']
  }
};

export default nextConfig;
