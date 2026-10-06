'use client';

import '../../index.css';

import { LOCALE_ISO_CODES } from '@blog/config';
import { GlobalErrorPage } from '@web/components/pages/global-error-page';

/**
 * Replaces the entire document when `[tenant]/[locale]/layout.tsx` (the root
 * layout) throws, so it owns `<html>`/`<body>` and re-imports the global
 * stylesheet that layout never got to load.
 */
export default function GlobalError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang={LOCALE_ISO_CODES.EN.toLowerCase()}>
      <body>
        <GlobalErrorPage {...props} />
      </body>
    </html>
  );
}
