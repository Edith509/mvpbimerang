/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    '192.168.100.92',
    '192.168.100.87',
    'localhost',
    'localhost:3000',
    '127.0.0.1',
    '*.ngrok-free.app',
    'ngrok-free.app',
    '*.ngrok.app',
    '*.ngrok-free.dev',
  ],
};

export default nextConfig;
