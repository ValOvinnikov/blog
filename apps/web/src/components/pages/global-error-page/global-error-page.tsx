'use client';

import { routes, TEXT_ROLE } from '@shinefold/config';
import { Button } from '@shinefold/ui/components/atoms/button';
import { Heading } from '@shinefold/ui/components/atoms/heading';
import { Text } from '@shinefold/ui/components/atoms/text';
import { LinkButton } from '@shinefold/ui/components/molecules/link-button';
import { errorBoundaryCopy } from '@web/components/shared/error-boundary-copy';
import { errorPageLayoutVariants } from '@web/components/shared/error-page-layout';
import { ERROR_BOUNDARY_LOG } from '@web/constants/error-boundary';
import { reportClientError } from '@web/utils/report-client-error';
import { useEffect, useRef } from 'react';

export type TGlobalErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const s = errorPageLayoutVariants();

/** Replaces the root layout, so it has no `NextIntlClientProvider` and its copy stays hardcoded English. */
export const GlobalErrorPage = ({ error, reset }: TGlobalErrorPageProps) => {
  const announcementRef = useRef<HTMLSpanElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    reportClientError(ERROR_BOUNDARY_LOG.GLOBAL_RENDER_FAILED, error, {
      digest: error.digest,
    });
    // A live region already populated when it mounts is unreliably announced.
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
      <Heading level={1} visual={TEXT_ROLE.HERO_TITLE}>
        {errorBoundaryCopy.heading}
      </Heading>
      <Text textRole={TEXT_ROLE.INTRO} className={s.copy()}>
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
