/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/tec',
  // Keep production builds from overwriting a running dev server's chunks.
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  async redirects() {
    return [
      {
        source: '/',
        destination: '/tec',
        permanent: false,
        basePath: false,
      },
    ];
  },
};

export default nextConfig;
