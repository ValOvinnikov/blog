'use client';

import { BookmarkToggle } from '@blog/ui/atoms';
import { useToast } from '@web/components/shared/toast-provider';
import {
  getBookmarkStatus,
  setBookmarkStatus,
} from '@web/server/bookmarks/bookmark-actions';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useTransition } from 'react';

import { bookmarkButtonVariants } from './bookmark-button-variants';

export type TBookmarkButtonProps = {
  /** The post's Sanity `_id` — `blog-post-page` threads this through from its existing `service.pages.post.v1.getPost` fetch, no separate lookup. */
  postId: string;
  className?: string;
};

/**
 * BookmarkButton — the article header meta strip's "save for later" client
 * island (#1043/#1109), composed beside `PostShare` in `PostMeta`'s `share`
 * slot. Wraps the pure `BookmarkToggle` atom; owns everything stateful:
 *
 * - **Logged out** → renders nothing (the design doc's accepted alternative
 *   to a "Sign in to save" affordance — there's no existing cross-component
 *   way to open the header's `AuthMenu` popover from here, and hiding the
 *   action entirely is the simpler, still-sanctioned option).
 * - **Session resolving** → a disabled/neutral `BookmarkToggle` (never
 *   flashes bookmarked), so a returning signed-in reader sees no pop-in once
 *   the session resolves.
 * - **Authenticated** → fetches the real initial state via
 *   `getBookmarkStatus` (disabled until that resolves — a failed fetch still
 *   resolves it, defaulting to "not bookmarked", so the toggle never gets
 *   stuck disabled), then toggles optimistically: flips its own state
 *   immediately, calls `setBookmarkStatus`, confirms the save/remove via a
 *   `useToast` success/info toast (#1138's original motivating use case),
 *   and rolls back + shows an error toast on failure.
 *
 * The save/remove toast carries an `undo ⌘Z` action (`performUndo`) that
 * re-applies the opposite value and confirms with its own async-revert-can-
 * fail `info`/`error` toast (design doc §4.5) — the secondary error toast
 * carries no further `retry` action, to avoid an unbounded retry chain. The
 * error toast carries a `retry R` action (`performToggle` re-run with the
 * same target value that just failed).
 */
export function BookmarkButton({ postId, className }: TBookmarkButtonProps) {
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
        console.error('Failed to load bookmark status:', fetchError);
        if (cancelled) return;
        setIsBookmarked(false);
        setIsResolved(true);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionResult.status, postId]);

  if (sessionResult.status === 'unauthenticated') return null;

  // The async, can-fail counterpart to `undo` (design doc §4.5) — reverts
  // the optimistic flip back to whatever it was before `committedValue`, and
  // confirms via its own `info`/`error` toast. That secondary error toast
  // carries no `retry` action, so a failed undo can't chain into an
  // unbounded retry-of-a-retry loop.
  const performUndo = (committedValue: boolean) => {
    const reverted = !committedValue;
    setIsBookmarked(reverted);

    startTransition(async () => {
      const result = await setBookmarkStatus(postId, reverted);
      if (!result.ok) {
        setIsBookmarked(committedValue);
        toast.error({
          command: t('toastCommand'),
          state: t('toastErrorState'),
          message: t('error'),
        });
        return;
      }

      toast.info({
        command: t('toastCommand'),
        state: t('toastRevertedState'),
        message: t('toastRevertedMessage'),
      });
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
          command: t('toastCommand'),
          state: t('toastErrorState'),
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
        toast.success({
          command: t('toastCommand'),
          state: t('toastSavedState'),
          message: t('toastSavedMessage'),
          action: undoAction,
        });
      } else {
        toast.info({
          command: t('toastCommand'),
          state: t('toastRemovedState'),
          message: t('toastRemovedMessage'),
          action: undoAction,
        });
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
        disabled={
          sessionResult.status === 'loading' || !isResolved || isPending
        }
      />
    </span>
  );
}
