import { CONTENT_ALIGNMENT, DISPLAY_MODE } from '@blog/config';
import type { TTeamModule } from '@blog/service';
import { CardGrid } from '@blog/ui/components/organisms/card-grid';
import { ActionGroup } from '@web/components/shared/action-group';
import { ModuleHeading } from '@web/components/shared/module-heading';
import { Section } from '@web/components/shared/section';
import { TeamCarousel } from '@web/modules/team/components/team-carousel/team-carousel';
import { TeamMemberCard } from '@web/modules/team/components/team-member-card/team-member-card';
import { TeamSpotlight } from '@web/modules/team/components/team-spotlight/team-spotlight';
import { moduleGridActionsVariants } from '@web/utils/module-grid-actions-variants';
import {
  CAROUSEL_IMAGE_SIZES,
  GRID_IMAGE_SIZES,
} from '@web/utils/module-image-sizes';
import { toModuleGridColumns } from '@web/utils/to-module-grid-columns';

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
  const s = moduleGridActionsVariants({ align: contentAlignment });

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
          className={s.grid()}
          dataTestId={`${dataTestId}-grid`}
        >
          {members.map((member) => (
            <TeamMemberCard
              key={member.id}
              member={member}
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
