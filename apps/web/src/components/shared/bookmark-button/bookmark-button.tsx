'use client';

import { ACTION_OUTCOME, type IWithClassName } from '@blog/config';
import { BookmarkToggle } from '@blog/ui/components/atoms/bookmark-toggle';
import { BOOKMARK_LOG } from '@web/constants/bookmark';
import { SESSION_STATUS } from '@web/constants/session';
import {
  ACCOUNT_OVERLAY_ID,
  useHeaderOverlay,
} from '@web/context/header-overlay-provider';
import { useToast } from '@web/context/toast-provider';
import {
  getBookmarkStatus,
  setBookmarkStatus,
} from '@web/server/bookmarks/bookmark-actions/bookmark-actions';
import { logger } from '@web/utils/logger/logger';
import { reportClientError } from '@web/utils/report-client-error';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useTransition } from 'react';

import { bookmarkButtonVariants } from './bookmark-button-variants';

export type TBookmarkButtonProps = IWithClassName & {
  postId: string;
};

export const BookmarkButton = ({ postId, className }: TBookmarkButtonProps) => {
  const t = useTranslations('bookmarkButton');
  const toast = useToast();
  const overlay = useHeaderOverlay();
  const { status } = useSession();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const s = bookmarkButtonVariants();

  useEffect(() => {
    if (status !== SESSION_STATUS.AUTHENTICATED) return;

    let cancelled = false;

    getBookmarkStatus(postId)
      .then((bookmarked) => {
        if (cancelled) return;
        setIsBookmarked(bookmarked);
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

  const performUndo = (committedValue: boolean) => {
    const reverted = !committedValue;

    setIsBookmarked(reverted);

    startTransition(async () => {
      const result = await setBookmarkStatus(postId, reverted);
      if (result.outcome !== ACTION_OUTCOME.SUCCESS) {
        setIsBookmarked(committedValue);
        toast.error({
          message: t(
            result.outcome === ACTION_OUTCOME.UNAVAILABLE
              ? 'errorUnavailable'
              : 'error',
          ),
        });
        return;
      }

      toast.info({ message: t('toastRevertedMessage') });
    });
  };

  const performToggle = (next: boolean) => {
    setIsBookmarked(next);

    startTransition(async () => {
      const result = await setBookmarkStatus(postId, next);
      if (result.outcome !== ACTION_OUTCOME.SUCCESS) {
        setIsBookmarked(!next);
        if (result.outcome === ACTION_OUTCOME.UNAVAILABLE) {
          toast.error({ message: t('errorUnavailable') });
          return;
        }
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
    if (status === SESSION_STATUS.UNAUTHENTICATED) {
      overlay?.openOverlay({ id: ACCOUNT_OVERLAY_ID, takesKeys: true });
      return;
    }
    if (!isResolved) return;

    performToggle(!isBookmarked);
  };

  const saveLabel = t('save');
  const savedLabel = t('saved');
  // The toggle is monospaced, so the longer label is the wider one.
  const widestLabel =
    savedLabel.length > saveLabel.length ? savedLabel : saveLabel;

  return (
    <span className={s.root({ class: className })}>
      <span inert={true} aria-hidden="true" className={s.sizer()}>
        <BookmarkToggle
          isBookmarked={false}
          onToggle={() => {}}
          label={widestLabel}
          ariaLabel={widestLabel}
        />
      </span>
      <BookmarkToggle
        isBookmarked={isBookmarked}
        onToggle={handleToggle}
        label={isBookmarked ? savedLabel : saveLabel}
        ariaLabel={isBookmarked ? t('removeAriaLabel') : t('saveAriaLabel')}
        isDisabled={isPending}
        className={s.toggle()}
      />
    </span>
  );
};
