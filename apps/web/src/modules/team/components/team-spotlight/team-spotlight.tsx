import {
  CARD_IMAGE_SHAPE,
  type IWithDataTestId,
  TEXT_ROLE,
} from '@shinefold/config';
import type { TTeamMember, TTeamModule } from '@shinefold/service';
import { Avatar } from '@shinefold/ui/components/atoms/avatar';
import { Heading } from '@shinefold/ui/components/atoms/heading';
import { MediaFrame } from '@shinefold/ui/components/atoms/media-frame';
import { Prose } from '@shinefold/ui/components/atoms/prose';
import { Text } from '@shinefold/ui/components/atoms/text';
import { hasLength } from '@shinefold/utils/primitives';
import { PortableText } from '@web/components/shared/portable-text';
import { SanityImage } from '@web/components/shared/sanity-image';
import { SmartLink } from '@web/components/shared/smart-link';
import { SocialLinks } from '@web/components/shared/social-links';

import { teamSpotlightVariants } from './team-spotlight-variants';

const IMAGE_SIZE_PX = 576;

export interface ITeamSpotlightProps extends IWithDataTestId {
  member: TTeamMember;
  imageShape: TTeamModule['imageShape'];
}

export const TeamSpotlight = ({
  member,
  imageShape,
  dataTestId,
}: ITeamSpotlightProps) => {
  const { name, image, role, bio, socialLinks, profileUrl } = member;
  const isCircle = imageShape === CARD_IMAGE_SHAPE.CIRCLE;
  const s = teamSpotlightVariants();

  return (
    <article className={s.root()} data-testid={dataTestId}>
      <MediaFrame
        ratio="square"
        shape={isCircle ? 'circle' : 'rect'}
        className={s.media()}
      >
        {image ? (
          <SanityImage
            image={image}
            width={IMAGE_SIZE_PX}
            height={IMAGE_SIZE_PX}
            sizes="(min-width: 1024px) 18rem, (min-width: 640px) 16rem, 12rem"
            loading="lazy"
            className={s.image()}
          />
        ) : (
          <Avatar
            alt={name}
            name={name}
            shape={isCircle ? 'circle' : 'square'}
            className={s.fallback()}
          />
        )}
      </MediaFrame>
      <div className={s.text()}>
        <Heading level={3} visual={TEXT_ROLE.ITEM_TITLE}>
          {profileUrl ? <SmartLink href={profileUrl}>{name}</SmartLink> : name}
        </Heading>
        {role ? <Text textRole={TEXT_ROLE.META}>{role}</Text> : null}
        {bio && (
          <Prose className={s.bio()}>
            <PortableText value={bio} />
          </Prose>
        )}
        {hasLength(socialLinks) && (
          <div className={s.social()}>
            <SocialLinks profiles={socialLinks} variant="outlined" />
          </div>
        )}
      </div>
    </article>
  );
};
