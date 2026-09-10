import { ICONS, SIZE } from '@blog/config';
import { Icon } from '@blog/ui/atoms/icon';
import { PostShare } from '@web/components/shared/post-share';
import { buildShareLinks } from '@web/utils/build-share-links';
import { toSocialIconName } from '@web/utils/to-social-icon-name';

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
    icon: (
      <Icon
        name={toSocialIconName(link.platform) ?? ICONS.EXTERNAL_LINK}
        size={SIZE.SM}
      />
    ),
  }));

  return <PostShare url={url} title={title} links={shareLinks} />;
};
