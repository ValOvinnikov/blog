import { buildContentSecurityPolicy } from '@platform/utils/content-security-policy/content-security-policy';
import { DRAFT_PREVIEW_ROUTE_SOURCES } from '@platform/utils/draft-preview-routes/draft-preview-routes';
import { createNextConfig } from '@shinefold/next-config/preset';
import { withBotId } from 'botid/next/config';

const isDev = process.env.NODE_ENV !== 'production';

const contentSecurityPolicy = buildContentSecurityPolicy({ isDev });
const draftPreviewContentSecurityPolicy = buildContentSecurityPolicy({
  isDev,
  canFrameAnySecureSite: true,
});

const nextConfig = createNextConfig({
  contentSecurityPolicy,
  // Headroom above `MAX_UPLOAD_BYTES.logo` (4 MB) for FormData framing; Next's 1 MB default 413s a logo upload before validation.
  experimental: {
    serverActions: {
      bodySizeLimit: '6mb',
    },
  },
  transpilePackages: ['@shinefold/ui'],
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
});
const presetHeaders = nextConfig.headers;

// withBotId wraps last: its own headers for the challenge path must follow, and so override, the site-wide CSP.
export default withBotId({
  ...nextConfig,
  // The last rule matching a path sets a header, so the draft preview routes' policy replaces the site-wide one.
  async headers() {
    return [
      ...((await presetHeaders?.()) ?? []),
      ...DRAFT_PREVIEW_ROUTE_SOURCES.map((source) => ({
        source,
        headers: [
          {
            key: 'Content-Security-Policy',
            value: draftPreviewContentSecurityPolicy,
          },
        ],
      })),
    ];
  },
});
