/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/tec',
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
