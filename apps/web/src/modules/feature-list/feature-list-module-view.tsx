import { CONTENT_ALIGNMENT, DISPLAY_MODE } from '@blog/config';
import type { TFeatureListModule } from '@blog/service';
import { CardGrid } from '@blog/ui/organisms/card-grid';
import { ActionGroup } from '@web/components/shared/action-group';
import { ModuleHeading } from '@web/components/shared/module-heading';
import { Section } from '@web/components/shared/section';
import { moduleGridActionsVariants } from '@web/utils/module-grid-actions-variants';
import { toModuleGridColumns } from '@web/utils/to-module-grid-columns';

import { FeatureListCard } from './feature-list-card';
import { FeatureListCarousel } from './feature-list-carousel';

const GRID_IMAGE_SIZES: Record<1 | 2 | 3 | 4, string> = {
  1: '100vw',
  2: '(min-width: 640px) 50vw, 100vw',
  3: '(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw',
  4: '(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw',
};

const CAROUSEL_IMAGE_SIZES =
  '(min-width: 768px) 33vw, (min-width: 640px) 50vw, 85vw';

export interface IFeatureListModuleViewProps extends TFeatureListModule {
  titleId: string;
  dataTestId: string;
}

export const FeatureListModuleView = ({
  brandVariant,
  headingBlock,
  items,
  ctaButtons,
  imageShape,
  displayMode,
  contentAlignment,
  cardAlignment,
  layout,
  titleId,
  dataTestId,
}: IFeatureListModuleViewProps) => {
  if (items.length === 0) return null;

  const cardAlign =
    cardAlignment === CONTENT_ALIGNMENT.CENTER ? 'center' : 'left';
  const columns = toModuleGridColumns(items.length);
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
        <FeatureListCarousel
          items={items}
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
          {items.map((item) => (
            <FeatureListCard
              key={item.id}
              item={item}
              imageShape={imageShape}
              align={cardAlign}
              imageSizes={GRID_IMAGE_SIZES[columns]}
              headingLevel={3}
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
