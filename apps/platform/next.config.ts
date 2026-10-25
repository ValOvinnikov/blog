import { createNextConfig } from '@blog/next-config/preset';
import { buildContentSecurityPolicy } from '@platform/utils/content-security-policy/content-security-policy';
import { withBotId } from 'botid/next/config';

const isDev = process.env.NODE_ENV !== 'production';

const contentSecurityPolicy = buildContentSecurityPolicy({ isDev });

// withBotId wraps last: its own headers for the challenge path must follow, and so override, the site-wide CSP.
export default withBotId(
  createNextConfig({
    contentSecurityPolicy,
    // Headroom above `MAX_UPLOAD_BYTES.logo` (4 MB) for FormData framing; Next's 1 MB default 413s a logo upload before validation.
    experimental: {
      serverActions: {
        bodySizeLimit: '6mb',
      },
    },
    transpilePackages: ['@blog/ui'],
    // Turbopack cannot bundle jsdom, and Next externalises it only under its own name, not this alias.
    serverExternalPackages: ['jsdom-commonjs'],
    images: {
      // A public Vercel Blob store's subdomain is per-store, hence the wildcard.
      remotePatterns: [
        {
          protocol: 'https',
          hostname: '*.blob.vercel-storage.com',
        },
      ],
    },
  }),
);
