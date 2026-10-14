import { CONTENT_ALIGNMENT, DISPLAY_MODE } from '@blog/config';
import type { TTeamModule } from '@blog/service';
import { CardGrid } from '@blog/ui/components/organisms/card-grid';
import { ActionGroup } from '@web/components/shared/action-group';
import { ModuleHeading } from '@web/components/shared/module-heading';
import { Section } from '@web/components/shared/section';
import { TeamCarousel } from '@web/modules/team/components/team-carousel/team-carousel';
import { TeamMemberCard } from '@web/modules/team/components/team-member-card/team-member-card';
import { TeamSpotlight } from '@web/modules/team/components/team-spotlight/team-spotlight';
import { isLoneLastInRow } from '@web/utils/is-lone-last-in-row';
import { moduleGridActionsVariants } from '@web/utils/module-grid-actions-variants';
import { toTeamGridColumns } from '@web/utils/to-team-grid-columns';

import { teamModuleViewVariants } from './team-module-view-variants';

export interface ITeamModuleViewProps extends TTeamModule {
  titleId: string;
  dataTestId: string;
}

export const TeamModuleView = ({
  brandVariant,
  headingBlock,
  members,
  showBios,
  imageShape,
  displayMode,
  cardAlignment,
  ctaButtons,
  contentAlignment,
  layout,
  titleId,
  dataTestId,
}: ITeamModuleViewProps) => {
  const [spotlightMember] = members;
  const isSpotlight = members.length === 1;
  const cardAlign =
    cardAlignment === CONTENT_ALIGNMENT.CENTER ? 'center' : 'left';
  const columns = toTeamGridColumns(members.length, showBios);
  const lastIndex = members.length - 1;
  const isLoneInRowOfThree = isLoneLastInRow(members.length, 3);
  const s = moduleGridActionsVariants({ align: contentAlignment });
  const v = teamModuleViewVariants({ columns });

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      titleId={titleId}
      dataTestId={dataTestId}
    >
      <ModuleHeading
        headingBlock={headingBlock}
        id={titleId}
        level={2}
        align={contentAlignment}
        variant="section"
      />
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
          tone={brandVariant}
          contentAlignment={contentAlignment}
        />
      ) : (
        <div className={v.gridContainer()}>
          <CardGrid
            columns={1}
            className={v.grid()}
            dataTestId={`${dataTestId}-grid`}
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
      {ctaButtons.length > 0 && (
        <div className={s.actions()}>
          <ActionGroup actions={ctaButtons} />
        </div>
      )}
    </Section>
  );
};
