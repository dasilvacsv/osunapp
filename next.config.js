/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        ignoreBuildErrors: true
    },
    eslint: {
     ignoreDuringBuilds: true   
    },
    images: {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'ppubqeyierpcobneghhh.supabase.co',
          }
        ]
      },
};

module.exports = nextConfig;
