import { routes } from '@blog/config';
import type { TSectionPagesModule } from '@blog/service';
import { MediaCard } from '@blog/ui/components/molecules/media-card';
import { CardGrid } from '@blog/ui/components/organisms/card-grid';
import { ModuleHeading } from '@web/components/shared/module-heading';
import { SanityImage } from '@web/components/shared/sanity-image';
import { Section } from '@web/components/shared/section';
import { SmartLink } from '@web/components/shared/smart-link';
import { stretchedLinkVariants } from '@web/components/shared/stretched-link';
import {
  SQUARE_IMAGE_SIZE,
  WIDE_IMAGE_HEIGHT,
} from '@web/utils/media-card-image-size';
import { moduleGridActionsVariants } from '@web/utils/module-grid-actions-variants';
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
  const s = moduleGridActionsVariants({ align: contentAlignment });
  const { image: imageClassName } = sectionPagesModuleViewVariants();

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
      <CardGrid columns={columns} className={s.grid()}>
        {pages.map(({ id, title, summary, image, path }) => (
          <MediaCard key={id} excerpt={summary} isInteractive={true}>
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
              <SmartLink
                href={routes.landingPage(path)}
                className={stretchedLinkVariants()}
              >
                {title}
              </SmartLink>
            </MediaCard.Title>
          </MediaCard>
        ))}
      </CardGrid>
    </Section>
  );
};
