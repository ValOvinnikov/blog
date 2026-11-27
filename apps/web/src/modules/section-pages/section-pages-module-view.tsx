import { routes } from '@shinefold/config';
import type { TSectionPagesModule } from '@shinefold/service';
import { MediaCard } from '@shinefold/ui/components/molecules/media-card';
import { CardGrid } from '@shinefold/ui/components/organisms/card-grid';
import { ModuleHeading } from '@web/components/shared/module-heading';
import { SanityImage } from '@web/components/shared/sanity-image';
import { Section, type TModuleSection } from '@web/components/shared/section';
import { SmartLink } from '@web/components/shared/smart-link';
import {
  SQUARE_IMAGE_SIZE,
  WIDE_IMAGE_HEIGHT,
} from '@web/utils/media-card-image-size';
import { GRID_IMAGE_SIZES } from '@web/utils/module-image-sizes';
import { toCardGridColumns } from '@web/utils/to-card-grid-columns';
import { toModuleGridColumns } from '@web/utils/to-module-grid-columns';

import { sectionPagesModuleViewVariants } from './section-pages-module-view-variants';

export type TSectionPagesModuleContent = Pick<
  TSectionPagesModule,
  'headingBlock' | 'pages' | 'contentAlignment' | 'columns'
>;

export interface ISectionPagesModuleViewProps extends TSectionPagesModuleContent {
  section: TModuleSection;
  titleId: string;
  dataTestId: string;
}

export const SectionPagesModuleView = ({
  section,
  headingBlock,
  pages,
  contentAlignment,
  columns: storedColumns,
  titleId,
  dataTestId,
}: ISectionPagesModuleViewProps) => {
  const { brandVariant, layout, appearance } = section;
  const columns =
    toCardGridColumns(storedColumns) ?? toModuleGridColumns(pages.length);

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      appearance={appearance}
      titleId={headingBlock && titleId}
      dataTestId={dataTestId}
    >
      {headingBlock && (
        <ModuleHeading
          headingBlock={headingBlock}
          id={titleId}
          level={2}
          align={contentAlignment}
        />
      )}
      <CardGrid columns={columns} dataTestId={`${dataTestId}-grid-${columns}`}>
        {pages.map(({ id, title, summary, image, path }) => {
          const { card, image: imageClassName } =
            sectionPagesModuleViewVariants({ hasImage: Boolean(image) });

          return (
            <MediaCard
              key={id}
              excerpt={summary}
              isInteractive={Boolean(path)}
              className={card()}
            >
              {image && (
                <MediaCard.Media dataTestId="section-page-card-media">
                  <SanityImage
                    image={image}
                    width={SQUARE_IMAGE_SIZE}
                    height={WIDE_IMAGE_HEIGHT}
                    sizes={GRID_IMAGE_SIZES[columns]}
                    loading="lazy"
                    className={imageClassName()}
                  />
                </MediaCard.Media>
              )}
              <MediaCard.Title level={headingBlock ? 3 : 2}>
                <MediaCard.Link href={routes.landingPage(path)} as={SmartLink}>
                  {title}
                </MediaCard.Link>
              </MediaCard.Title>
            </MediaCard>
          );
        })}
      </CardGrid>
    </Section>
  );
};
