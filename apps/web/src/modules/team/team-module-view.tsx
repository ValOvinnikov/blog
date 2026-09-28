import { CONTENT_ALIGNMENT, DISPLAY_MODE } from '@blog/config';
import type { TTeamModule } from '@blog/service';
import { CardGrid } from '@blog/ui/components/organisms/card-grid';
import { ActionGroup } from '@web/components/shared/action-group';
import { ModuleHeading } from '@web/components/shared/module-heading';
import { Section } from '@web/components/shared/section';
import { moduleGridActionsVariants } from '@web/utils/module-grid-actions-variants';
import { toModuleGridColumns } from '@web/utils/to-module-grid-columns';

import { TeamCarousel } from './team-carousel';
import { TeamMemberCard } from './team-member-card';

const GRID_IMAGE_SIZES: Record<1 | 2 | 3 | 4, string> = {
  1: '100vw',
  2: '(min-width: 640px) 50vw, 100vw',
  3: '(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw',
  4: '(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw',
};

const CAROUSEL_IMAGE_SIZES =
  '(min-width: 768px) 33vw, (min-width: 640px) 50vw, 85vw';

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
      {displayMode === DISPLAY_MODE.CAROUSEL ? (
        <TeamCarousel
          members={members}
          imageShape={imageShape}
          align={cardAlign}
          imageSizes={CAROUSEL_IMAGE_SIZES}
          title={headingBlock.heading}
          tone={brandVariant}
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
