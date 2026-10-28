'use client';

import type { TMaybeUndefined } from '@blog/config';
import { NEWSLETTER_LOG } from '@web/constants/newsletter';
import { SESSION_STATUS } from '@web/constants/session';
import { isReaderSubscribedToNewsletter } from '@web/server/newsletter/reader-subscription-status/reader-subscription-status';
import { reportClientError } from '@web/utils/report-client-error';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export const useIsReaderSubscribed = (): TMaybeUndefined<boolean> => {
  const { status } = useSession();
  const [isSubscribed, setIsSubscribed] =
    useState<TMaybeUndefined<boolean>>(undefined);
  const isAuthenticated = status === SESSION_STATUS.AUTHENTICATED;

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    isReaderSubscribedToNewsletter()
      .then((subscribed) => {
        if (!cancelled) setIsSubscribed(subscribed);
      })
      .catch((error: unknown) => {
        reportClientError(NEWSLETTER_LOG.GATE_STATUS_FETCH_FAILED, error);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  return isAuthenticated ? isSubscribed : undefined;
};
