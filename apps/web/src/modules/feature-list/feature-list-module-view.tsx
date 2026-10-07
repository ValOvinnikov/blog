import { CONTENT_ALIGNMENT, DISPLAY_MODE } from '@blog/config';
import type { TFeatureListModule } from '@blog/service';
import { CardGrid } from '@blog/ui/components/organisms/card-grid';
import { ActionGroup } from '@web/components/shared/action-group';
import { ModuleHeading } from '@web/components/shared/module-heading';
import { Section } from '@web/components/shared/section';
import { FeatureListCard } from '@web/modules/feature-list/components/feature-list-card/feature-list-card';
import { FeatureListCarousel } from '@web/modules/feature-list/components/feature-list-carousel/feature-list-carousel';
import { moduleGridActionsVariants } from '@web/utils/module-grid-actions-variants';
import {
  CAROUSEL_IMAGE_SIZES,
  GRID_IMAGE_SIZES,
} from '@web/utils/module-image-sizes';
import { toModuleGridColumns } from '@web/utils/to-module-grid-columns';

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
  const cardAlign =
    cardAlignment === CONTENT_ALIGNMENT.CENTER ? 'center' : 'left';
  const columns = toModuleGridColumns(items.length);
  const s = moduleGridActionsVariants({ align: contentAlignment });
  const hasAnyImage = items.some((item) => Boolean(item.sanityImage));

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
          contentAlignment={contentAlignment}
          hasAnyImage={hasAnyImage}
        />
      ) : (
        <CardGrid columns={columns} dataTestId={`${dataTestId}-grid`}>
          {items.map((item) => (
            <FeatureListCard
              key={item.id}
              item={item}
              imageShape={imageShape}
              align={cardAlign}
              imageSizes={GRID_IMAGE_SIZES[columns]}
              headingLevel={3}
              hasAnyImage={hasAnyImage}
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
