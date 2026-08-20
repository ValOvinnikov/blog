'use client';

import { routes } from '@blog/config';
import { Button, Heading, Text } from '@blog/ui/atoms';
import { LinkButton } from '@blog/ui/molecules';
import { errorPageLayoutVariants } from '@web/components/shared/error-page-layout';
import { reportClientError } from '@web/utils/report-client-error';
import { useEffect, useRef } from 'react';

export type TErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const s = errorPageLayoutVariants();

/**
 * Rendered by `app/error.tsx` — the error boundary for everything below the
 * root layout, including `[locale]/layout.tsx` itself. It can't assume
 * `NextIntlClientProvider` is available, so this stays hardcoded English and
 * "Go home" is a plain anchor rather than `SmartLink`.
 */
export function ErrorPage({ error, reset }: TErrorPageProps) {
  const announcementRef = useRef<HTMLSpanElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    reportClientError('error_boundary.render_failed', error, {
      digest: error.digest,
    });
    // Written after mount, not on first paint — a live region that's
    // already populated when it enters the DOM is unreliably announced.
    if (announcementRef.current) {
      announcementRef.current.textContent =
        'Something went wrong. You can try again, or go home.';
    }
    mainRef.current?.focus();
  }, [error]);

  return (
    <main ref={mainRef} tabIndex={-1} className={s.root()}>
      <span
        ref={announcementRef}
        aria-live="assertive"
        aria-atomic="true"
        className={s.announcement()}
      />
      <Heading level={1} visual="hero">
        Something went wrong
      </Heading>
      <Text className={s.copy()}>
        An unexpected error occurred while rendering this page. You can try
        again, or head back to the homepage.
      </Text>
      <div className={s.actions()}>
        <Button onClick={reset}>Try again</Button>
        <LinkButton href={routes.home()} variant="ghost">
          Go home
        </LinkButton>
      </div>
    </main>
  );
}
