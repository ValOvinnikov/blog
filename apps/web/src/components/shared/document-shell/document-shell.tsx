import '../../../../index.css';

import { themeBootstrapScript } from '@web/config/theme-script';
import type { ReactNode } from 'react';

type TDocumentShellProps = {
  lang: string;
  children: ReactNode;
};

// Fixed public hostname for every Sanity project's asset CDN (not per-tenant).
// No `crossOrigin`: images load as plain requests, which an anonymous
// preconnect's connection can't serve.
const SANITY_IMAGE_CDN_ORIGIN = 'https://cdn.sanity.io';

export const DocumentShell = ({ lang, children }: TDocumentShellProps) => (
  <html lang={lang} suppressHydrationWarning={true}>
    {/* eslint-disable-next-line @next/next/no-head-element -- an App Router document shell, which the pages-router rule can't tell apart from a page */}
    <head>
      <link rel="preconnect" href={SANITY_IMAGE_CDN_ORIGIN} />
      <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
    </head>
    <body>{children}</body>
  </html>
);
