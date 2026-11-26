'use client';

import '../../index.css';

import { LOCALE_ISO_CODES } from '@shinefold/config';
import { GlobalErrorPage } from '@web/components/pages/global-error-page';
import type { TErrorPageProps } from '@web/components/shared/error-page-layout';

/**
 * Replaces the entire document when `[tenant]/[locale]/layout.tsx` (the root
 * layout) throws, so it owns `<html>`/`<body>` and re-imports the global
 * stylesheet that layout never got to load.
 */
export default function GlobalError(props: TErrorPageProps) {
  return (
    <html lang={LOCALE_ISO_CODES.EN.toLowerCase()}>
      <body>
        <GlobalErrorPage {...props} />
      </body>
    </html>
  );
}
