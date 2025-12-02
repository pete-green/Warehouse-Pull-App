/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for development
  reactStrictMode: true,

  // Image optimization for Supabase storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vmjngtmjdrasytgqsvxp.supabase.co',
        port: '',
        pathname: '/storage/**',
      },
    ],
  },
}

export default nextConfig
