// The constants barrel pulls in aliased runtime imports Next's config transpiler cannot resolve, so import the one file.
import { EMBED_ORIGINS } from '@blog/config/constants/embed';
import { createNextConfig } from '@blog/next-config/preset';
import { withBotId } from 'botid/next/config';

import {
  buildContentSecurityPolicy,
  FRAME_ANCESTORS_NONE,
} from './src/config/content-security-policy';
import { PREVIEW_TOKEN_QUERY_PARAM } from './src/server/draft-preview/constants/constants';

// withBotId wraps last: its own headers for the challenge path must follow, and so override, the site-wide CSP and X-Frame-Options.
export default withBotId(
  createNextConfig({
    contentSecurityPolicy: buildContentSecurityPolicy(
      FRAME_ANCESTORS_NONE,
      EMBED_ORIGINS,
    ),
    proxyOwnsFramingForQueryParam: PREVIEW_TOKEN_QUERY_PARAM,
    experimental: {
      // No single root layout exists to compose a 404 from: `<html lang>` is owned by `[tenant]/[locale]/layout.tsx`.
      globalNotFound: true,
    },
    transpilePackages: [
      '@blog/ui',
      '@blog/service',
      '@blog/config',
      '@blog/email',
      '@blog/next-config',
    ],
    images: {
      // Next's static-image types declare `*.svg` as `any`, clashing with @blog/ui's typed SVGR declarations.
      disableStaticImages: true,
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'cdn.sanity.io',
        },
      ],
    },
  }),
);
