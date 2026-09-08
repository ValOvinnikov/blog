import { CAPABILITY } from '@blog/config';
import { BookmarkButton } from '@web/components/shared/bookmark-button';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled';

export type TBookmarkButtonGateProps = {
  postId: string;
  tenant: string;
};

/**
 * BookmarkButtonGate — renders `BookmarkButton` only when the tenant is
 * entitled to (and has enabled) the `BOOKMARKS` capability; renders nothing
 * otherwise.
 */
export const BookmarkButtonGate = async ({
  postId,
  tenant,
}: TBookmarkButtonGateProps) => {
  const isEnabled = await isCapabilityEnabled(CAPABILITY.BOOKMARKS, tenant);
  if (!isEnabled) return null;

  return <BookmarkButton postId={postId} />;
};
