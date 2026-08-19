'use client';

import { Button, Heading, Text } from '@blog/ui/atoms';
import { reportClientError } from '@web/utils/report-client-error';
import { useEffect } from 'react';

import { globalErrorPageVariants } from './global-error-page-variants';

export type TGlobalErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const s = globalErrorPageVariants();

/**
 * The content rendered inside `app/global-error.tsx`'s own `<html>`/`<body>`
 * — this boundary replaces the root layout entirely, so like `ErrorPage` it
 * stays self-contained and hardcoded-English rather than depending on
 * `NextIntlClientProvider`, which is set up further down the tree than a
 * root-layout failure can reach.
 */
export function GlobalErrorPage({ error, reset }: TGlobalErrorPageProps) {
  useEffect(() => {
    reportClientError('global_error_boundary.render_failed', error, {
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className={s.root()}>
      <Heading level={1} visual="hero">
        Something went wrong
      </Heading>
      <Text className={s.copy()}>
        An unexpected error occurred. Try reloading the page.
      </Text>
      <div className={s.actions()}>
        <Button onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
