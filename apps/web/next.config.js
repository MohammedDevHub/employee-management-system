/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  output: "export",

  basePath: "/employee-management-system",

  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
