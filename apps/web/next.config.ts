import type { NextConfig } from 'next';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers:
          process.env.NODE_ENV === 'production'
            ? [
                ...securityHeaders,
                { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
              ]
            : securityHeaders,
      },
    ];
  },
};

export default nextConfig;
