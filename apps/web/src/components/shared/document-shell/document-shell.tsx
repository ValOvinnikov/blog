import '../../../../index.css';

import { COLOR_SCHEME, type TColorScheme } from '@shinefold/config';
import type { IWithChildren } from '@shinefold/config/react';
import { signedInHintBootstrapScript } from '@web/config/signed-in-hint-script';
import { themeBootstrapScript } from '@web/config/theme-script';
import { SANITY_IMAGE_CDN_PRECONNECT_TEST_ID } from '@web/constants/document-shell';

type TDocumentShellProps = IWithChildren & {
  lang: string;
  lockedColorScheme?: TColorScheme;
};

// Fixed public hostname for every Sanity project's asset CDN (not per-tenant).
// No `crossOrigin`: images load as plain requests, which an anonymous
// preconnect's connection can't serve.
const SANITY_IMAGE_CDN_ORIGIN = 'https://cdn.sanity.io';

export const DocumentShell = ({
  lang,
  lockedColorScheme,
  children,
}: TDocumentShellProps) => (
  <html
    lang={lang}
    className={lockedColorScheme === COLOR_SCHEME.DARK ? 'dark' : undefined}
    style={
      lockedColorScheme && { colorScheme: lockedColorScheme.toLowerCase() }
    }
    suppressHydrationWarning={true}
  >
    {/* eslint-disable-next-line @next/next/no-head-element -- an App Router document shell, which the pages-router rule can't tell apart from a page */}
    <head>
      <link
        rel="preconnect"
        href={SANITY_IMAGE_CDN_ORIGIN}
        data-testid={SANITY_IMAGE_CDN_PRECONNECT_TEST_ID}
      />
      {!lockedColorScheme && (
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      )}
      <script
        dangerouslySetInnerHTML={{ __html: signedInHintBootstrapScript }}
      />
    </head>
    <body>{children}</body>
  </html>
);
