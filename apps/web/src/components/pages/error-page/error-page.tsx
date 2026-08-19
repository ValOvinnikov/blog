'use client';

import { Button, Heading, Text } from '@blog/ui/atoms';
import { errorPageLayoutVariants } from '@web/components/shared/error-page-layout';
import { reportClientError } from '@web/utils/report-client-error';
import { useEffect } from 'react';

export type TErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const s = errorPageLayoutVariants();

/**
 * Rendered by `app/error.tsx` — the error boundary for everything below the
 * root layout, including `[locale]/layout.tsx` itself. A failure in that
 * layout is exactly the case this boundary exists to catch, so it can't
 * assume the `NextIntlClientProvider`/site chrome that layout normally sets
 * up is available — this stays a small, self-contained, hardcoded-English
 * fallback rather than reaching for `useTranslations` or site chrome.
 */
export function ErrorPage({ error, reset }: TErrorPageProps) {
  useEffect(() => {
    reportClientError('error_boundary.render_failed', error, {
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className={s.root()}>
      <Heading level={1} visual="hero">
        Something went wrong
      </Heading>
      <Text className={s.copy()}>
        An unexpected error occurred while rendering this page. You can try
        again, or head back to the homepage.
      </Text>
      <div className={s.actions()}>
        <Button onClick={reset}>Try again</Button>
        <Button variant="ghost" onClick={() => window.location.assign('/')}>
          Go home
        </Button>
      </div>
    </main>
  );
}
