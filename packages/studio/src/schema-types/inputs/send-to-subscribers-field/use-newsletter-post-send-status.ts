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

const SENDING_REFRESH_MS = 10_000;

type TStatusRead = { status: TMaybeUndefined<TNewsletterPostSendStatus> };

export type TNewsletterPostSendStatusState = {
  isLoading: boolean;
  status: TMaybeUndefined<TNewsletterPostSendStatus>;
  refresh: () => void;
};

/** `revision` re-reads the status whenever the published post changes, since a publish is what takes its claim. */
export const useNewsletterPostSendStatus = (
  { projectId, postId, isPublished }: TNewsletterPostRef,
  revision: TMaybeUndefined<string>,
): TNewsletterPostSendStatusState => {
  const [read, setRead] = useState<TStatusRead>();
  const [refreshCount, setRefreshCount] = useState(0);
  const refresh = useCallback(() => {
    setRefreshCount((count) => count + 1);
  }, []);

  useEffect(() => {
    let isCurrent = true;
    void readNewsletterPostSendStatus({ projectId, postId, isPublished }).then(
      (status) => {
        if (isCurrent) setRead({ status });
      },
    );
    return () => {
      isCurrent = false;
    };
  }, [projectId, postId, isPublished, revision, refreshCount]);

  const status = read?.status;
  const isSending = status?.status === NEWSLETTER_SEND_STATUS.SENDING;

  useEffect(() => {
    if (!isSending) return;
    const timer = setTimeout(refresh, SENDING_REFRESH_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [isSending, read, refresh]);

  return { isLoading: !read, status, refresh };
};
