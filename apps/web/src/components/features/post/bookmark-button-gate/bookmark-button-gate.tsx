import { CAPABILITY } from '@blog/config';
import { BookmarkButton } from '@web/components/shared/bookmark-button';
import { isReaderAccountFeatureEnabled } from '@web/server/settings-features/is-reader-account-enabled/is-reader-account-enabled';
import { isRequestTenantActive } from '@web/server/tenant/write-gate/write-gate';

export type TBookmarkButtonGateProps = {
  postId: string;
};

export const BookmarkButtonGate = async ({
  postId,
}: TBookmarkButtonGateProps) => {
  const [isEnabled, isActive] = await Promise.all([
    isReaderAccountFeatureEnabled(CAPABILITY.BOOKMARKS),
    isRequestTenantActive(),
  ]);
  if (!isEnabled || !isActive) return null;

  return <BookmarkButton postId={postId} />;
};
