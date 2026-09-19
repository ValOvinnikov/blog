'use client';

import { BookmarkToggle } from '@blog/ui/atoms/bookmark-toggle';
import { useToast } from '@web/context/toast-provider';
import {
  getBookmarkStatus,
  setBookmarkStatus,
} from '@web/server/bookmarks/bookmark-actions';
import { logger } from '@web/utils/logger/logger';
import { reportClientError } from '@web/utils/report-client-error';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useTransition } from 'react';

import { bookmarkButtonVariants } from './bookmark-button-variants';

export type TBookmarkButtonProps = {
  postId: string;
  className?: string;
};

/**
 * The save/remove toast carries an `undo` action (`performUndo`) that
 * re-applies the opposite value and confirms with its own async-revert-can-
 * fail `info`/`error` toast; that secondary error toast carries no further
 * `retry` action, to avoid an unbounded retry chain. The primary error toast
 * carries a `retry` action (`performToggle` re-run with the same target
 * value that just failed).
 */
export const BookmarkButton = ({ postId, className }: TBookmarkButtonProps) => {
  const t = useTranslations('bookmarkButton');
  const toast = useToast();
  const sessionResult = useSession();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const s = bookmarkButtonVariants();

  useEffect(() => {
    if (sessionResult.status !== 'authenticated') return;

    let cancelled = false;

    getBookmarkStatus(postId)
      .then((bookmarked) => {
        if (cancelled) return;
        setIsBookmarked(bookmarked);
        setIsResolved(true);
      })
      .catch((fetchError: unknown) => {
        // A transient failure here (e.g. the db read throwing) must not
        // leave the toggle permanently disabled with no explanation —
        // resolve to "not bookmarked" and let the reader retry via a normal
        // toggle, same recovery shape as `useCopyToClipboard`'s own
        // `.then().catch()`.
        logger.error('bookmark_button.status_fetch_failed', {
          postId,
          error: fetchError,
        });
        reportClientError('bookmark_button.status_fetch_failed', fetchError);
        if (cancelled) return;
        setIsBookmarked(false);
        setIsResolved(true);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionResult.status, postId]);

  if (sessionResult.status === 'unauthenticated') return null;

  const performUndo = (committedValue: boolean) => {
    const reverted = !committedValue;

    setIsBookmarked(reverted);

    startTransition(async () => {
      const result = await setBookmarkStatus(postId, reverted);
      if (!result.ok) {
        setIsBookmarked(committedValue);
        toast.error({ message: t('error') });
        return;
      }

      toast.info({ message: t('toastRevertedMessage') });
    });
  };

  // Shared by the click handler and the error toast's `retry` action, so a
  // retry is literally the same attempt re-run against the same target value.
  const performToggle = (next: boolean) => {
    setIsBookmarked(next);

    startTransition(async () => {
      const result = await setBookmarkStatus(postId, next);
      if (!result.ok) {
        setIsBookmarked(!next);
        toast.error({
          message: t('error'),
          action: {
            label: t('toastRetryLabel'),
            keyHint: 'R',
            onAct: () => performToggle(next),
          },
        });
        return;
      }

      const undoAction = {
        label: t('toastUndoLabel'),
        onAct: () => performUndo(next),
      };

      if (next) {
        toast.success({ message: t('toastSavedMessage'), action: undoAction });
      } else {
        toast.info({ message: t('toastRemovedMessage'), action: undoAction });
      }
    });
  };

  const handleToggle = () => {
    performToggle(!isBookmarked);
  };

  return (
    <span className={s.root({ class: className })}>
      <BookmarkToggle
        isBookmarked={isBookmarked}
        onToggle={handleToggle}
        label={isBookmarked ? t('saved') : t('save')}
        ariaLabel={isBookmarked ? t('removeAriaLabel') : t('saveAriaLabel')}
        isDisabled={
          sessionResult.status === 'loading' || !isResolved || isPending
        }
      />
    </span>
  );
};
