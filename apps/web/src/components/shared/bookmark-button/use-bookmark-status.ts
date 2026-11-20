'use client';

import { BOOKMARK_LOG } from '@web/constants/bookmark';
import { SESSION_STATUS } from '@web/constants/session';
import { getBookmarkStatus } from '@web/server/bookmarks/bookmark-actions/bookmark-actions';
import { logger } from '@web/utils/logger/logger';
import { unlessPageOutOfDate } from '@web/utils/page-out-of-date';
import { reportClientError } from '@web/utils/report-client-error';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export const useBookmarkStatus = (postId: string) => {
  const { status } = useSession();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isResolved, setIsResolved] = useState(false);

  useEffect(() => {
    if (status !== SESSION_STATUS.AUTHENTICATED) return;

    let cancelled = false;

    unlessPageOutOfDate(getBookmarkStatus(postId))
      .then((bookmarked) => {
        if (cancelled) return;
        setIsBookmarked(bookmarked ?? false);
        setIsResolved(true);
      })
      .catch((fetchError: unknown) => {
        logger.error(BOOKMARK_LOG.BUTTON_STATUS_FETCH_FAILED, {
          postId,
          error: fetchError,
        });
        reportClientError(BOOKMARK_LOG.BUTTON_STATUS_FETCH_FAILED, fetchError);
        if (cancelled) return;
        setIsBookmarked(false);
        setIsResolved(true);
      });

    return () => {
      cancelled = true;
    };
  }, [status, postId]);

  return { status, isBookmarked, setIsBookmarked, isResolved };
};
