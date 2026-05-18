/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export so the docs site deploys to any host — Cloudflare Pages,
  // Vercel, GitHub Pages, S3, the same VPS as the facilitator, anywhere.
  output: "export",
  // Trailing slashes match how forum.auranode.xyz/docs serves.
  trailingSlash: false,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
