import { CAPABILITY } from '@blog/config';
import { BookmarkButton } from '@web/components/shared/bookmark-button';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import { isRequestTenantActive } from '@web/server/tenant/write-gate/write-gate';

export type TBookmarkButtonGateProps = {
  postId: string;
};

export const BookmarkButtonGate = async ({
  postId,
}: TBookmarkButtonGateProps) => {
  const [isEnabled, isActive] = await Promise.all([
    isCapabilityEnabled(CAPABILITY.BOOKMARKS),
    isRequestTenantActive(),
  ]);
  if (!isEnabled || !isActive) return null;

  return <BookmarkButton postId={postId} />;
};
