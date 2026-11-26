'use client';

import { routes } from '@shinefold/config';
import { Button } from '@shinefold/ui/components/atoms/button';
import { LinkButton } from '@shinefold/ui/components/molecules/link-button';
import { errorBoundaryCopy } from '@web/components/shared/error-boundary-copy';
import {
  ErrorPageLayout,
  type TErrorPageProps,
} from '@web/components/shared/error-page-layout';
import { ERROR_BOUNDARY_LOG } from '@web/constants/error-boundary';
import { useErrorPageAnnouncement } from '@web/hooks/use-error-page-announcement';

/** Replaces the root layout, so it has no `NextIntlClientProvider` and its copy stays hardcoded English. */
export const GlobalErrorPage = ({ error, reset }: TErrorPageProps) => {
  const { heading, intro, tryAgain, goHome, announcement } = errorBoundaryCopy;
  const { mainRef, announcementRef } = useErrorPageAnnouncement({
    error,
    logEvent: ERROR_BOUNDARY_LOG.GLOBAL_RENDER_FAILED,
    announcement,
  });

  return (
    <ErrorPageLayout
      title={heading}
      mainRef={mainRef}
      announcementRef={announcementRef}
      actions={
        <>
          <Button onClick={reset}>{tryAgain}</Button>
          <LinkButton href={routes.home()} variant="ghost">
            {goHome}
          </LinkButton>
        </>
      }
    >
      {intro}
    </ErrorPageLayout>
  );
};
