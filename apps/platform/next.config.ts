import { createNextConfig } from '@blog/next-config/preset';
import { buildContentSecurityPolicy } from '@platform/utils/content-security-policy/content-security-policy';

const isDev = process.env.NODE_ENV !== 'production';

const contentSecurityPolicy = buildContentSecurityPolicy({ isDev });

export default createNextConfig({
  contentSecurityPolicy,
  // Next's own Server Action body-size cap defaults to 1 MB — well under the
  // Look tab's declared logo limit (`MAX_UPLOAD_BYTES.logo`, 4 MB in
  // `@platform/utils/brand-asset-limits`). Without raising it here, any upload
  // over ~1 MB never reaches `validateBrandAssetUpload` at all: Next's body
  // parser 413s first. Set with headroom above the 4 MB logo ceiling (not
  // an exact match) to absorb multipart/FormData framing overhead — keep
  // this above `MAX_UPLOAD_BYTES.logo` if that constant ever grows.
  experimental: {
    serverActions: {
      bodySizeLimit: '6mb',
    },
  },
  transpilePackages: ['@blog/ui'],
  images: {
    // Matches the CSP `img-src` allowance above: a public-access Vercel
    // Blob store's pathname is per-store, not fixed, hence the wildcard
    // subdomain rather than one pinned hostname.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.blob.vercel-storage.com',
      },
    ],
  },
});
