import {
  CARD_IMAGE_SHAPE,
  type IWithClassName,
  type IWithDataTestId,
} from '@blog/config';
import type { TTeamMember, TTeamModule } from '@blog/service';
import { Avatar } from '@blog/ui/components/atoms/avatar';
import { MediaCard } from '@blog/ui/components/molecules/media-card';
import { PortableText } from '@web/components/shared/portable-text';
import { SanityImage } from '@web/components/shared/sanity-image';
import { SmartLink } from '@web/components/shared/smart-link';
import { SocialLinks } from '@web/components/shared/social-links';
import { CIRCLE_IMAGE_SIZE } from '@web/utils/media-card-image-size';

import {
  teamMemberCardAvatarFallbackVariants,
  teamMemberCardVariants,
} from './team-member-card-variants';

// 2x the square photo's `w-48` cap.
const CAPPED_SQUARE_IMAGE_SIZE = 384;

export interface ITeamMemberCardProps extends IWithClassName, IWithDataTestId {
  member: TTeamMember;
  imageShape: TTeamModule['imageShape'];
  align: 'left' | 'center';
}

export const TeamMemberCard = ({
  member,
  imageShape,
  align,
  className,
  dataTestId,
}: ITeamMemberCardProps) => {
  const mediaShape =
    imageShape === CARD_IMAGE_SHAPE.CIRCLE ? 'circle' : 'square';
  const imageSize =
    mediaShape === 'circle' ? CIRCLE_IMAGE_SIZE : CAPPED_SQUARE_IMAGE_SIZE;
  const s = teamMemberCardVariants({ shape: mediaShape, align });

  return (
    <div className={s.root({ class: className })}>
      <MediaCard
        align={align}
        isInteractive={Boolean(member.profileUrl)}
        className={s.card()}
        dataTestId={dataTestId}
      >
        <MediaCard.Media shape={mediaShape} align={align} className={s.media()}>
          {member.image ? (
            <SanityImage
              image={member.image}
              width={imageSize}
              height={imageSize}
              loading="lazy"
              className={s.image()}
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
            <MediaCard.Link href={member.profileUrl} as={SmartLink}>
              {member.name}
            </MediaCard.Link>
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
          <MediaCard.Footer>
            <SocialLinks profiles={member.socialLinks} variant="outlined" />
          </MediaCard.Footer>
        )}
      </MediaCard>
    </div>
  );
};
