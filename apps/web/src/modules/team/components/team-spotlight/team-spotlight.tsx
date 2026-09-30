import { CARD_IMAGE_SHAPE, type IWithDataTestId } from '@blog/config';
import type { TTeamMember, TTeamModule } from '@blog/service';
import { Avatar } from '@blog/ui/components/atoms/avatar';
import { Heading } from '@blog/ui/components/atoms/heading';
import { MediaFrame } from '@blog/ui/components/atoms/media-frame';
import { Prose } from '@blog/ui/components/atoms/prose';
import { Text } from '@blog/ui/components/atoms/text';
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
  const s = teamSpotlightVariants({ isCircle });

  return (
    <article className={s.root()} data-testid={dataTestId}>
      <MediaFrame ratio="square" className={s.media()}>
        {image ? (
          <SanityImage
            image={image}
            width={IMAGE_SIZE_PX}
            height={IMAGE_SIZE_PX}
            sizes="(min-width: 1024px) 18rem, (min-width: 640px) 16rem, 12rem"
            loading="lazy"
            className="size-full object-cover"
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
        <Heading level={3} visual="prose-h3">
          {profileUrl ? <SmartLink href={profileUrl}>{name}</SmartLink> : name}
        </Heading>
        {role ? <Text variant="muted">{role}</Text> : null}
        {bio && (
          <Prose className={s.bio()}>
            <PortableText value={bio} />
          </Prose>
        )}
        {socialLinks.length > 0 && (
          <div className={s.social()}>
            <SocialLinks profiles={socialLinks} variant="outlined" />
          </div>
        )}
      </div>
    </article>
  );
};
