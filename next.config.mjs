/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    'pdf-parse',
    'pdfjs-dist',
    // Native addon; must not be Webpacked—pdfjs may `require` it on the server at runtime
    '@napi-rs/canvas',
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
