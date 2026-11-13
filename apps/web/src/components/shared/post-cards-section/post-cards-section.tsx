import {
  DISPLAY_MODE,
  type TContentAlignmentOf,
  type TDisplayMode,
  type THeadingBlock,
  type TMaybeUndefined,
} from '@blog/config';
import {
  CardGrid,
  type TCardGridProps,
} from '@blog/ui/components/organisms/card-grid';
import { CardCarousel } from '@web/components/shared/card-carousel';
import {
  type IMediaCardData,
  MediaCardItem,
} from '@web/components/shared/media-card-item';
import { ModuleHeading } from '@web/components/shared/module-heading';
import { Section, type ISectionProps } from '@web/components/shared/section';

export interface IPostCardsSectionProps {
  section: Pick<ISectionProps, 'brandVariant' | 'layout' | 'appearance'>;
  headingBlock: THeadingBlock;
  contentAlignment: TMaybeUndefined<TContentAlignmentOf<'LEFT' | 'CENTER'>>;
  displayMode?: TDisplayMode;
  items: IMediaCardData[];
  gridColumns: TCardGridProps['columns'];
  titleId: string;
  dataTestId: string;
  hasImages?: boolean;
}

export const PostCardsSection = ({
  section,
  headingBlock,
  items,
  gridColumns,
  titleId,
  dataTestId,
  contentAlignment,
  hasImages,
  displayMode,
}: IPostCardsSectionProps) => {
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
        <CardGrid columns={gridColumns}>
          {items.map((item) => (
            <MediaCardItem key={item.id} item={item} hasImage={hasImages} />
          ))}
        </CardGrid>
      )}
    </Section>
  );
};
