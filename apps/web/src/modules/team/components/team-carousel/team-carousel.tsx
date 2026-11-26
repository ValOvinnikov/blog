'use client';

import type { IWithClassName, IWithDataTestId } from '@shinefold/config';
import type { TTeamMember, TTeamModule } from '@shinefold/service';
import type { ICarouselProps } from '@shinefold/ui/components/organisms/carousel';
import { LabelledCarousel } from '@web/components/shared/labelled-carousel';
import { TeamMemberCard } from '@web/modules/team/components/team-member-card/team-member-card';
import type { TCardAlign } from '@web/utils/to-card-align';

export interface ITeamCarouselProps extends IWithClassName, IWithDataTestId {
  members: TTeamMember[];
  imageShape: TTeamModule['imageShape'];
  align: TCardAlign;
  title: string;
  contentAlignment?: ICarouselProps<TTeamMember>['contentAlignment'];
}

export const TeamCarousel = ({
  members,
  imageShape,
  align,
  title,
  contentAlignment,
  className,
  dataTestId,
}: ITeamCarouselProps) => (
  <LabelledCarousel
    items={members}
    renderItem={({ item }) => (
      <TeamMemberCard member={item} imageShape={imageShape} align={align} />
    )}
    getItemKey={({ item }) => item.id}
    title={title}
    contentAlignment={contentAlignment}
    className={className}
    slideSize="singleHalvesThirds"
    dataTestId={dataTestId}
  />
);
