'use client';

import { BookmarkToggle } from '@blog/ui/atoms';
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

// "Transient" per the design doc (Feature 4 states) — long enough to read,
// short enough not to linger once the reader has moved on.
const ERROR_DISMISS_DELAY_MS = 4000;

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
 *   `getBookmarkStatus` (disabled until that resolves), then toggles
 *   optimistically: flips its own state immediately, calls
 *   `setBookmarkStatus`, and rolls back + shows a transient inline error on
 *   failure.
 */
export function BookmarkButton({ postId, className }: TBookmarkButtonProps) {
  const t = useTranslations('bookmarkButton');
  const sessionResult = useSession();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();
  const s = bookmarkButtonVariants();

  useEffect(() => {
    if (sessionResult.status !== 'authenticated') return;

    let cancelled = false;

    getBookmarkStatus(postId).then((bookmarked) => {
      if (cancelled) return;
      setIsBookmarked(bookmarked);
      setIsResolved(true);
    });

    return () => {
      cancelled = true;
    };
  }, [sessionResult.status, postId]);

  useEffect(() => {
    if (!error) return;

    const timeout = setTimeout(
      () => setError(undefined),
      ERROR_DISMISS_DELAY_MS,
    );
    return () => clearTimeout(timeout);
  }, [error]);

  if (sessionResult.status === 'unauthenticated') return null;

  const handleToggle = () => {
    const next = !isBookmarked;
    setIsBookmarked(next);
    setError(undefined);

    startTransition(async () => {
      const result = await setBookmarkStatus(postId, next);
      if (!result.ok) {
        setIsBookmarked(!next);
        setError(t('error'));
      }
    });
  };

  return (
    <span className={s.root({ class: className })}>
      <BookmarkToggle
        isBookmarked={isBookmarked}
        onToggle={handleToggle}
        ariaLabel={isBookmarked ? t('removeAriaLabel') : t('saveAriaLabel')}
        disabled={
          sessionResult.status === 'loading' || !isResolved || isPending
        }
      />
      {error && (
        <p role="alert" className={s.errorNotice()}>
          {error}
        </p>
      )}
    </span>
  );
}
