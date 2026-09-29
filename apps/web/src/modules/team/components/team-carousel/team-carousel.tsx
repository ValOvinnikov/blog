'use client';

import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { TTeamMember, TTeamModule } from '@blog/service';
import type { ICarouselProps } from '@blog/ui/components/organisms/carousel';
import { LabelledCarousel } from '@web/components/shared/labelled-carousel';
import { TeamMemberCard } from '@web/modules/team/components/team-member-card/team-member-card';

export interface ITeamCarouselProps extends IWithClassName, IWithDataTestId {
  members: TTeamMember[];
  imageShape: TTeamModule['imageShape'];
  align: 'left' | 'center';
  imageSizes: string;
  title: string;
  tone: TTeamModule['brandVariant'];
  contentAlignment?: ICarouselProps<TTeamMember>['contentAlignment'];
}

export const TeamCarousel = ({
  members,
  imageShape,
  align,
  imageSizes,
  title,
  tone,
  contentAlignment,
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
    contentAlignment={contentAlignment}
    className={className}
    dataTestId={dataTestId}
  />
);
