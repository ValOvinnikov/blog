import { DISPLAY_MODE } from '@blog/config';
import type { TPostLatestModule } from '@blog/service';
import { Heading } from '@blog/ui/atoms/heading';
import { CardGrid } from '@blog/ui/organisms/card-grid';
import { CardCarousel } from '@web/components/shared/card-carousel';
import {
  type IMediaCardData,
  MediaCardItem,
} from '@web/components/shared/media-card-item';
import { Section } from '@web/components/shared/section';

import { postLatestModuleViewVariants } from './post-latest-module-view-variants';

export interface IPostLatestModuleViewProps extends Omit<
  TPostLatestModule,
  'posts' | 'showImages'
> {
  items: IMediaCardData[];
  titleId: string;
  dataTestId: string;
  hasImages?: boolean;
}

/**
 * PostLatestModuleView — render shell for `PostLatestModule`: a labeled
 * `Section` wrapping either a `CardCarousel` or a `CardGrid` of
 * `MediaCardItem`s. Never called with an empty `items` — `PostLatestModule`
 * renders nothing itself in that case.
 */
export const PostLatestModuleView = ({
  brandVariant,
  headingBlock,
  items,
  layout,
  titleId,
  dataTestId,
  contentAlignment,
  hasImages,
  displayMode,
}: IPostLatestModuleViewProps) => {
  const { heading, supportingText } = headingBlock;
  const s = postLatestModuleViewVariants({ align: contentAlignment });

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      titleId={titleId}
      dataTestId={dataTestId}
    >
      <Heading level={2} id={titleId} className={s.label()}>
        {heading}
      </Heading>
      {supportingText && <p className={s.supportingText()}>{supportingText}</p>}
      {displayMode === DISPLAY_MODE.CAROUSEL ? (
        <CardCarousel
          items={items}
          hasImages={hasImages}
          title={heading}
          tone={brandVariant}
        />
      ) : (
        <CardGrid className={s.grid()}>
          {items.map((item) => (
            <MediaCardItem key={item.id} item={item} hasImage={hasImages} />
          ))}
        </CardGrid>
      )}
    </Section>
  );
};
