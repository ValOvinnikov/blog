'use client';

import {
  type IWithClassName,
  isOutcomeSuccess,
  isOutcomeUnavailable,
} from '@shinefold/config';
import { BookmarkToggle } from '@shinefold/ui/components/atoms/bookmark-toggle';
import { SESSION_STATUS } from '@web/constants/session';
import {
  ACCOUNT_OVERLAY_ID,
  useHeaderOverlay,
} from '@web/context/header-overlay-provider';
import { useToast } from '@web/context/toast-provider';
import { setBookmarkStatus } from '@web/server/bookmarks/bookmark-actions/bookmark-actions';
import { unlessPageOutOfDate } from '@web/utils/page-out-of-date';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

import { bookmarkButtonVariants } from './bookmark-button-variants';
import { useBookmarkStatus } from './use-bookmark-status';

export type TBookmarkButtonProps = IWithClassName & {
  postId: string;
};

export const BookmarkButton = ({ postId, className }: TBookmarkButtonProps) => {
  const t = useTranslations('bookmarkButton');
  const toast = useToast();
  const overlay = useHeaderOverlay();
  const { status, isBookmarked, setIsBookmarked, isResolved } =
    useBookmarkStatus(postId);
  const [isPending, startTransition] = useTransition();
  const s = bookmarkButtonVariants();

  const performUndo = (committedValue: boolean) => {
    const reverted = !committedValue;

    setIsBookmarked(reverted);

    startTransition(async () => {
      const result = await unlessPageOutOfDate(
        setBookmarkStatus(postId, reverted),
      );
      if (!result || !isOutcomeSuccess(result)) {
        setIsBookmarked(committedValue);
        if (!result) return;
        toast.error({
          message: t(
            isOutcomeUnavailable(result) ? 'errorUnavailable' : 'error',
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
      const result = await unlessPageOutOfDate(setBookmarkStatus(postId, next));
      if (!result || !isOutcomeSuccess(result)) {
        setIsBookmarked(!next);
        if (!result) return;
        if (isOutcomeUnavailable(result)) {
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
