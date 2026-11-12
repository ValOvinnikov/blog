import { DISPLAY_MODE } from '@blog/config';
import type { TPostLatestModule } from '@blog/service';
import { CardGrid } from '@blog/ui/components/organisms/card-grid';
import { CardCarousel } from '@web/components/shared/card-carousel';
import {
  type IMediaCardData,
  MediaCardItem,
} from '@web/components/shared/media-card-item';
import { ModuleHeading } from '@web/components/shared/module-heading';
import { Section, type ISectionProps } from '@web/components/shared/section';
import { toCardGridColumns } from '@web/utils/to-card-grid-columns';

export interface IPostLatestModuleViewProps extends Pick<
  TPostLatestModule,
  'headingBlock' | 'contentAlignment' | 'displayMode' | 'columns'
> {
  section: Pick<ISectionProps, 'brandVariant' | 'layout' | 'appearance'>;
  items: IMediaCardData[];
  titleId: string;
  dataTestId: string;
  hasImages?: boolean;
}

export const PostLatestModuleView = ({
  section,
  headingBlock,
  items,
  columns,
  titleId,
  dataTestId,
  contentAlignment,
  hasImages,
  displayMode,
}: IPostLatestModuleViewProps) => {
  const { brandVariant, layout, appearance } = section;
  const { heading } = headingBlock;

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
        <CardCarousel
          items={items}
          hasImages={hasImages}
          title={heading}
          tone={brandVariant}
          contentAlignment={contentAlignment}
        />
      ) : (
        <CardGrid columns={toCardGridColumns(columns)}>
          {items.map((item) => (
            <MediaCardItem key={item.id} item={item} hasImage={hasImages} />
          ))}
        </CardGrid>
      )}
    </Section>
  );
};
