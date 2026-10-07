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
import {
  CAROUSEL_IMAGE_SIZES,
  GRID_IMAGE_SIZES,
} from '@web/utils/module-image-sizes';
import { toModuleGridColumns } from '@web/utils/to-module-grid-columns';

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
  const baseColumns = toModuleGridColumns(members.length);
  const columns = showBios && baseColumns === 4 ? 3 : baseColumns;
  const lastIndex = members.length - 1;
  const isLoneFromLg = isLoneLastInRow(members.length, columns);
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
          imageSizes={CAROUSEL_IMAGE_SIZES}
          title={headingBlock.heading}
          tone={brandVariant}
          contentAlignment={contentAlignment}
        />
      ) : (
        <CardGrid
          columns={columns}
          className={v.grid()}
          dataTestId={`${dataTestId}-grid`}
        >
          {members.map((member, index) => (
            <TeamMemberCard
              key={member.id}
              member={member}
              className={v.item({
                isLoneFromLg: index === lastIndex && isLoneFromLg,
              })}
              imageShape={imageShape}
              align={cardAlign}
              imageSizes={GRID_IMAGE_SIZES[columns]}
            />
          ))}
        </CardGrid>
      )}
      {ctaButtons.length > 0 && (
        <div className={s.actions()}>
          <ActionGroup actions={ctaButtons} />
        </div>
      )}
    </Section>
  );
};
