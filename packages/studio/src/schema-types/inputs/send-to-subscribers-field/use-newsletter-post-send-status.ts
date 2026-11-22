import {
  NEWSLETTER_SEND_STATUS,
  type TNewsletterPostSendStatus,
} from '@shinefold/config';
import type { TMaybeUndefined } from '@shinefold/config/types';
import {
  readNewsletterPostSendStatus,
  type TNewsletterPostRef,
} from '@shinefold/studio/platform-routes/newsletter-post-send/newsletter-post-send';
import { useCallback, useEffect, useState } from 'react';

export const SEND_STATUS_REFRESH_MS = 10_000;

// Six reads, a minute in all, cover the publish webhook taking the post's claim.
export const CLAIM_CHECKS_AFTER_PUBLISH = 6;

type TStatusRead = {
  status: TMaybeUndefined<TNewsletterPostSendStatus>;
  attempt: number;
};

export type TNewsletterPostSendStatusState = {
  isLoading: boolean;
  isAwaitingClaim: boolean;
  status: TMaybeUndefined<TNewsletterPostSendStatus>;
  refresh: () => void;
};

export const useNewsletterPostSendStatus = (
  { projectId, postId, isPublished }: TNewsletterPostRef,
  publishedRevision: TMaybeUndefined<string>,
): TNewsletterPostSendStatusState => {
  const [read, setRead] = useState<TStatusRead>();
  const [refreshCount, setRefreshCount] = useState(0);
  const [seenRevision, setSeenRevision] = useState(publishedRevision);
  const [claimChecksLeft, setClaimChecksLeft] = useState(0);
  const refresh = useCallback(() => {
    setRefreshCount((count) => count + 1);
  }, []);

  if (seenRevision !== publishedRevision) {
    setSeenRevision(publishedRevision);
    setClaimChecksLeft(publishedRevision ? CLAIM_CHECKS_AFTER_PUBLISH : 0);
  }

  useEffect(() => {
    let isCurrent = true;
    void readNewsletterPostSendStatus({ projectId, postId, isPublished }).then(
      (status) => {
        if (!isCurrent) return;
        setRead((previous) => ({
          status: status ?? previous?.status,
          attempt: (previous?.attempt ?? 0) + 1,
        }));
      },
    );
    return () => {
      isCurrent = false;
    };
  }, [projectId, postId, isPublished, publishedRevision, refreshCount]);

  const status = read?.status;
  const isSending = status?.status === NEWSLETTER_SEND_STATUS.SENDING;
  const isAwaitingClaim =
    isPublished &&
    claimChecksLeft > 0 &&
    status?.status === NEWSLETTER_SEND_STATUS.NONE;

  useEffect(() => {
    if (!isSending && !isAwaitingClaim) return;
    const timer = setTimeout(() => {
      if (isAwaitingClaim) setClaimChecksLeft((left) => left - 1);
      refresh();
    }, SEND_STATUS_REFRESH_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [isSending, isAwaitingClaim, read, refresh]);

  return { isLoading: !read, isAwaitingClaim, status, refresh };
};
