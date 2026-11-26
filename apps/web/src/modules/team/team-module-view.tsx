import { DISPLAY_MODE } from '@shinefold/config';
import type { TTeamModule } from '@shinefold/service';
import { CardGrid } from '@shinefold/ui/components/organisms/card-grid';
import { ModuleActions } from '@web/components/shared/module-actions';
import { ModuleSection } from '@web/components/shared/module-section';
import type { TModuleSection } from '@web/components/shared/section';
import { TeamCarousel } from '@web/modules/team/components/team-carousel/team-carousel';
import { TeamMemberCard } from '@web/modules/team/components/team-member-card/team-member-card';
import { TeamSpotlight } from '@web/modules/team/components/team-spotlight/team-spotlight';
import { isLoneLastInRow } from '@web/utils/is-lone-last-in-row';
import { toCardAlign } from '@web/utils/to-card-align';
import { toCardGridColumns } from '@web/utils/to-card-grid-columns';
import { toTeamGridColumns } from '@web/utils/to-team-grid-columns';

import { teamModuleViewVariants } from './team-module-view-variants';

export interface ITeamModuleViewProps extends Pick<
  TTeamModule,
  'headingBlock' | 'members' | 'displayMode' | 'ctaButtons' | 'contentAlignment'
> {
  section: TModuleSection;
  card: Pick<TTeamModule, 'imageShape' | 'cardAlignment'>;
  grid: Pick<TTeamModule, 'columns' | 'showBios'>;
  id: string;
}

export const TeamModuleView = ({
  section,
  headingBlock,
  members,
  displayMode,
  ctaButtons,
  contentAlignment,
  card,
  grid,
  id,
}: ITeamModuleViewProps) => {
  const { imageShape, cardAlignment } = card;
  const titleId = `team-${id}`;
  const dataTestId = `team-module-${id}`;
  const [spotlightMember] = members;
  const isSpotlight = members.length === 1;
  const cardAlign = toCardAlign(cardAlignment);
  const columns =
    toCardGridColumns(grid.columns) ??
    toTeamGridColumns(members.length, grid.showBios);
  const lastIndex = members.length - 1;
  const isLoneInRowOfThree = isLoneLastInRow(members.length, 3);
  const v = teamModuleViewVariants({ columns });

  return (
    <ModuleSection
      module={{ ...section, headingBlock, contentAlignment }}
      titleId={titleId}
      dataTestId={dataTestId}
    >
      {isSpotlight && spotlightMember ? (
        <TeamSpotlight
          member={spotlightMember}
          imageShape={imageShape}
          dataTestId={`${dataTestId}-spotlight`}
        />
      ) : displayMode === DISPLAY_MODE.CAROUSEL ? (
        <TeamCarousel
          members={members}
          imageShape={imageShape}
          align={cardAlign}
          title={headingBlock.heading}
          contentAlignment={contentAlignment}
        />
      ) : (
        <div className={v.gridContainer()}>
          <CardGrid
            columns={1}
            className={v.grid()}
            dataTestId={`${dataTestId}-grid-${columns}`}
          >
            {members.map((member, index) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                className={v.item({
                  isLoneInRowOfThree: index === lastIndex && isLoneInRowOfThree,
                })}
                imageShape={imageShape}
                align={cardAlign}
              />
            ))}
          </CardGrid>
        </div>
      )}
      <ModuleActions actions={ctaButtons} align={contentAlignment} />
    </ModuleSection>
  );
};
