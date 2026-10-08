import { routes } from '@blog/config';
import type { TSectionPagesModule } from '@blog/service';
import { MediaCard } from '@blog/ui/components/molecules/media-card';
import { CardGrid } from '@blog/ui/components/organisms/card-grid';
import { ModuleHeading } from '@web/components/shared/module-heading';
import { SanityImage } from '@web/components/shared/sanity-image';
import { Section } from '@web/components/shared/section';
import { SmartLink } from '@web/components/shared/smart-link';
import {
  SQUARE_IMAGE_SIZE,
  WIDE_IMAGE_HEIGHT,
} from '@web/utils/media-card-image-size';
import { GRID_IMAGE_SIZES } from '@web/utils/module-image-sizes';
import { toModuleGridColumns } from '@web/utils/to-module-grid-columns';

import { sectionPagesModuleViewVariants } from './section-pages-module-view-variants';

export interface ISectionPagesModuleViewProps extends TSectionPagesModule {
  titleId: string;
  dataTestId: string;
}

export const SectionPagesModuleView = ({
  brandVariant,
  headingBlock,
  pages,
  contentAlignment,
  layout,
  titleId,
  dataTestId,
}: ISectionPagesModuleViewProps) => {
  const columns = toModuleGridColumns(pages.length);

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      titleId={headingBlock && titleId}
      dataTestId={dataTestId}
    >
      {headingBlock && (
        <ModuleHeading
          headingBlock={headingBlock}
          id={titleId}
          level={2}
          align={contentAlignment}
          variant="section"
        />
      )}
      <CardGrid columns={columns}>
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
                <MediaCard.Link
                  href={routes.landingPage(path)}
                  linkAs={SmartLink}
                >
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
