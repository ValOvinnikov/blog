'use client';

import '../../index.css';

import { LOCALE_ISO_CODES } from '@blog/config';
import { GlobalErrorPage } from '@web/components/pages/global-error-page';

/**
 * Replaces the entire document (including `<html>`/`<body>`) when the root
 * layout itself throws — the one place Next.js requires a route file to own
 * the document shell outside `app/layout.tsx`. Re-imports the global
 * stylesheet directly since it can't rely on the failed root layout having
 * already done so.
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
