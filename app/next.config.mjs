/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'i.ytimg.com',
          },
        ],
      },
      eslint: {
        ignoreDuringBuilds: true,
      },
      typescript: {
        ignoreBuildErrors: true,
      },
};

export default nextConfig;
