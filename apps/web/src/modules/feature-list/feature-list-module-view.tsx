import { CONTENT_ALIGNMENT, DISPLAY_MODE } from '@blog/config';
import type { TFeatureListModule } from '@blog/service';
import { CardGrid } from '@blog/ui/components/organisms/card-grid';
import { hasLength } from '@blog/utils/primitives';
import { ActionGroup } from '@web/components/shared/action-group';
import { ModuleHeading } from '@web/components/shared/module-heading';
import { Section, type TModuleSection } from '@web/components/shared/section';
import { FeatureListCard } from '@web/modules/feature-list/components/feature-list-card/feature-list-card';
import { FeatureListCarousel } from '@web/modules/feature-list/components/feature-list-carousel/feature-list-carousel';
import { moduleGridActionsVariants } from '@web/utils/module-grid-actions-variants';
import {
  CAROUSEL_IMAGE_SIZES,
  GRID_IMAGE_SIZES,
} from '@web/utils/module-image-sizes';
import { toCardGridColumns } from '@web/utils/to-card-grid-columns';
import { toModuleGridColumns } from '@web/utils/to-module-grid-columns';

export interface IFeatureListModuleViewProps extends Pick<
  TFeatureListModule,
  | 'headingBlock'
  | 'items'
  | 'ctaButtons'
  | 'imageShape'
  | 'displayMode'
  | 'contentAlignment'
  | 'cardAlignment'
  | 'columns'
> {
  section: TModuleSection;
  id: string;
}

export const FeatureListModuleView = ({
  section,
  headingBlock,
  items,
  ctaButtons,
  imageShape,
  displayMode,
  contentAlignment,
  cardAlignment,
  columns: storedColumns,
  id,
}: IFeatureListModuleViewProps) => {
  const { brandVariant, layout, appearance } = section;
  const titleId = `feature-list-${id}`;
  const dataTestId = `feature-list-module-${id}`;
  const cardAlign =
    cardAlignment === CONTENT_ALIGNMENT.CENTER ? 'center' : 'left';
  const columns =
    toCardGridColumns(storedColumns) ?? toModuleGridColumns(items.length);
  const s = moduleGridActionsVariants({ align: contentAlignment });
  const hasAnyImage = items.some((item) => Boolean(item.sanityImage));

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      appearance={appearance}
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
        <CardGrid
          columns={columns}
          dataTestId={`${dataTestId}-grid-${columns}`}
        >
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
      {hasLength(ctaButtons) && (
        <div className={s.actions()}>
          <ActionGroup actions={ctaButtons} />
        </div>
      )}
    </Section>
  );
};
