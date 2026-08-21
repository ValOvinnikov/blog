'use client';

import { routes } from '@blog/config';
import { Button } from '@blog/ui/atoms/button';
import { Heading } from '@blog/ui/atoms/heading';
import { Text } from '@blog/ui/atoms/text';
import { LinkButton } from '@blog/ui/molecules/link-button';
import { errorBoundaryCopy } from '@web/components/shared/error-boundary-copy';
import { errorPageLayoutVariants } from '@web/components/shared/error-page-layout';
import { reportClientError } from '@web/utils/report-client-error';
import { useEffect, useRef } from 'react';

export type TGlobalErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const s = errorPageLayoutVariants();

/**
 * The content rendered inside `app/global-error.tsx`'s own `<html>`/`<body>`
 * — this boundary replaces the root layout entirely, so like `ErrorPage` it
 * can't assume `NextIntlClientProvider`, staying hardcoded English with a
 * plain anchor for "Go home" instead of `SmartLink`.
 */
export const GlobalErrorPage = ({ error, reset }: TGlobalErrorPageProps) => {
  const announcementRef = useRef<HTMLSpanElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    reportClientError('global_error_boundary.render_failed', error, {
      digest: error.digest,
    });
    // Written after mount, not on first paint — a live region that's
    // already populated when it enters the DOM is unreliably announced.
    if (announcementRef.current) {
      announcementRef.current.textContent = errorBoundaryCopy.announcement;
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
        {errorBoundaryCopy.heading}
      </Heading>
      <Text className={s.copy()}>
        An unexpected error occurred. Try reloading the page.
      </Text>
      <div className={s.actions()}>
        <Button onClick={reset}>{errorBoundaryCopy.tryAgain}</Button>
        <LinkButton href={routes.home()} variant="ghost">
          {errorBoundaryCopy.goHome}
        </LinkButton>
      </div>
    </main>
  );
};
