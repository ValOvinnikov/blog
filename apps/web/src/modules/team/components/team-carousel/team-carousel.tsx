'use client';

import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { TTeamMember, TTeamModule } from '@blog/service';
import { LabelledCarousel } from '@web/components/shared/labelled-carousel';
import { TeamMemberCard } from '@web/modules/team/components/team-member-card/team-member-card';

export interface ITeamCarouselProps extends IWithClassName, IWithDataTestId {
  members: TTeamMember[];
  imageShape: TTeamModule['imageShape'];
  align: 'left' | 'center';
  imageSizes: string;
  title: string;
  tone: TTeamModule['brandVariant'];
}

export const TeamCarousel = ({
  members,
  imageShape,
  align,
  imageSizes,
  title,
  tone,
  className,
  dataTestId,
}: ITeamCarouselProps) => (
  <LabelledCarousel
    items={members}
    renderItem={({ item }) => (
      <TeamMemberCard
        member={item}
        imageShape={imageShape}
        align={align}
        imageSizes={imageSizes}
      />
    )}
    getItemKey={({ item }) => item.id}
    title={title}
    tone={tone}
    className={className}
    dataTestId={dataTestId}
  />
);
