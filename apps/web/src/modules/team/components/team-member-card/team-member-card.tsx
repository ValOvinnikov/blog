import { CARD_IMAGE_SHAPE, type IWithDataTestId } from '@blog/config';
import type { TTeamMember, TTeamModule } from '@blog/service';
import { Avatar } from '@blog/ui/components/atoms/avatar';
import { MediaCard } from '@blog/ui/components/molecules/media-card';
import { PortableText } from '@web/components/shared/portable-text';
import { SanityImage } from '@web/components/shared/sanity-image';
import { SmartLink } from '@web/components/shared/smart-link';
import { SocialLinks } from '@web/components/shared/social-links';
import { stretchedLinkVariants } from '@web/components/shared/stretched-link';
import {
  CIRCLE_IMAGE_SIZE,
  SQUARE_IMAGE_SIZE,
} from '@web/utils/media-card-image-size';

import {
  teamMemberCardAvatarFallbackVariants,
  teamMemberCardVariants,
} from './team-member-card-variants';

export interface ITeamMemberCardProps extends IWithDataTestId {
  member: TTeamMember;
  imageShape: TTeamModule['imageShape'];
  align: 'left' | 'center';
  imageSizes: string;
}

export const TeamMemberCard = ({
  member,
  imageShape,
  align,
  imageSizes,
  dataTestId,
}: ITeamMemberCardProps) => {
  const mediaShape =
    imageShape === CARD_IMAGE_SHAPE.CIRCLE ? 'circle' : 'square';
  const imageSize =
    mediaShape === 'circle' ? CIRCLE_IMAGE_SIZE : SQUARE_IMAGE_SIZE;
  const s = teamMemberCardVariants();

  return (
    <MediaCard
      align={align}
      isInteractive={Boolean(member.profileUrl)}
      dataTestId={dataTestId}
    >
      <MediaCard.Media shape={mediaShape} align={align}>
        {member.image ? (
          <SanityImage
            image={member.image}
            width={imageSize}
            height={imageSize}
            sizes={mediaShape === 'circle' ? undefined : imageSizes}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <Avatar
            alt={member.name}
            name={member.name}
            shape={mediaShape}
            className={teamMemberCardAvatarFallbackVariants()}
          />
        )}
      </MediaCard.Media>
      <MediaCard.Title level={3}>
        {member.profileUrl ? (
          <SmartLink
            href={member.profileUrl}
            className={stretchedLinkVariants()}
          >
            {member.name}
          </SmartLink>
        ) : (
          member.name
        )}
      </MediaCard.Title>
      {member.role ? <p className={s.role()}>{member.role}</p> : null}
      {member.bio && (
        <div className={s.bio()}>
          <PortableText value={member.bio} />
        </div>
      )}
      {member.socialLinks.length > 0 && (
        <SocialLinks profiles={member.socialLinks} variant="outlined" />
      )}
    </MediaCard>
  );
};
