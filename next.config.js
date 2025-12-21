/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/PokeAPI/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        pathname: '/**',
      },
    ],
  },
  output: 'standalone', // Para Docker
  // No longer need MongoDB in frontend
  // experimental: {
  //   serverComponentsExternalPackages: ['mongodb'],
  // },
};

module.exports = nextConfig;
