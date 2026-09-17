import { SIZE, SOCIAL_PLATFORM_ICON } from '@blog/config';
import { Icon } from '@blog/ui/atoms/icon';
import { PostShare } from '@web/components/shared/post-share';
import { buildShareLinks } from '@web/utils/build-share-links';

export type TPostShareLinksProps = {
  url: string;
  title: string;
};

/**
 * PostShareLinks — builds the post's share links (`buildShareLinks`) and
 * attaches each platform's icon, then hands them to the interactive
 * `PostShare` widget.
 */
export const PostShareLinks = ({ url, title }: TPostShareLinksProps) => {
  const shareLinks = buildShareLinks({ url, title }).map((link) => ({
    ...link,
    icon: <Icon name={SOCIAL_PLATFORM_ICON[link.platform]} size={SIZE.SM} />,
  }));

  return <PostShare url={url} title={title} links={shareLinks} />;
};
