import { createHash } from 'node:crypto';

import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

import { themeBootstrapScript } from './src/config/theme-script';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Allow-lists the inline dark-mode bootstrap script (see
// `src/app/[locale]/layout.tsx`) in the CSP `script-src` below. The app is
// statically generated / ISR, so a per-request nonce would force dynamic
// rendering — a hash of the (stable, constant) script text works instead
// and requires no request-time computation.
const themeScriptHash = `'sha256-${createHash('sha256').update(themeBootstrapScript).digest('base64')}'`;

const contentSecurityPolicy = [
  "default-src 'self'",
  "img-src 'self' https://cdn.sanity.io data:",
  `script-src 'self' ${themeScriptHash}`,
  // 'unsafe-inline' is required because Next.js and Tailwind inject inline
  // <style> tags at runtime (e.g. Next's style-loader output, CSS-in-JS
  // from streamed RSC payloads); there is no static, hashable set of style
  // content to allow-list instead.
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "connect-src 'self' https://cdn.sanity.io",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: contentSecurityPolicy,
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
];

const config: NextConfig = {
  transpilePackages: ['@blog/ui', '@blog/service', '@blog/config'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(config);
