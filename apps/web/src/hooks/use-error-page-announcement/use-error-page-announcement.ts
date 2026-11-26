'use client';

import type { TMaybeNull } from '@shinefold/config';
import type { TValueOf } from '@shinefold/config/utils';
import type { TErrorPageProps } from '@web/components/shared/error-page-layout';
import type { ERROR_BOUNDARY_LOG } from '@web/constants/error-boundary';
import { reportClientError } from '@web/utils/report-client-error';
import { useEffect, useRef } from 'react';

interface IUseErrorPageAnnouncementOptions extends Pick<
  TErrorPageProps,
  'error'
> {
  logEvent: TValueOf<typeof ERROR_BOUNDARY_LOG>;
  announcement: string;
}

export const useErrorPageAnnouncement = ({
  error,
  logEvent,
  announcement,
}: IUseErrorPageAnnouncementOptions) => {
  const announcementRef = useRef<HTMLSpanElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const reportedErrorRef = useRef<TMaybeNull<Error>>(null);

  useEffect(() => {
    // The announcement can change without a new error, so report once per error.
    if (reportedErrorRef.current !== error) {
      reportedErrorRef.current = error;
      reportClientError(logEvent, error, { digest: error.digest });
    }
    // A live region already populated when it mounts is unreliably announced.
    if (announcementRef.current) {
      announcementRef.current.textContent = announcement;
    }
    mainRef.current?.focus();
  }, [error, logEvent, announcement]);

  return { announcementRef, mainRef };
};
