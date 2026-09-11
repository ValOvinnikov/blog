import { DISPLAY_MODE } from '@blog/config';
import type { TPostLatestModule } from '@blog/service';
import { Heading } from '@blog/ui/atoms/heading';
import { PostGrid } from '@blog/ui/organisms/post-grid';
import {
  type IPostCardData,
  PostCardItem,
} from '@web/components/shared/post-card-item';
import { PostsCarousel } from '@web/components/shared/posts-carousel';
import { Section } from '@web/components/shared/section';

import { postLatestModuleViewVariants } from './post-latest-module-view-variants';

export interface IPostLatestModuleViewProps extends Omit<
  TPostLatestModule,
  'posts' | 'showImages'
> {
  items: IPostCardData[];
  titleId: string;
  dataTestId: string;
  accessibleTitle: string;
  hasImages?: boolean;
}

/**
 * PostLatestModuleView — render shell for `PostLatestModule`: a labeled
 * `Section` wrapping either a `PostsCarousel` or a `PostGrid` of
 * `PostCardItem`s. Never called with an empty `items` — `PostLatestModule`
 * renders nothing itself in that case.
 */
export const PostLatestModuleView = ({
  brandVariant,
  headingBlock,
  items,
  layout,
  titleId,
  dataTestId,
  accessibleTitle,
  contentAlignment,
  hasImages,
  displayMode,
}: IPostLatestModuleViewProps) => {
  const { heading, supportingText } = headingBlock;
  const hasHeading = Boolean(heading?.trim());
  const resolvedTitle = hasHeading && heading ? heading : accessibleTitle;
  const s = postLatestModuleViewVariants({ align: contentAlignment });

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      titleId={titleId}
      dataTestId={dataTestId}
    >
      <Heading
        level={2}
        id={titleId}
        className={hasHeading ? s.label() : s.labelFallback()}
      >
        {resolvedTitle}
      </Heading>
      {supportingText && <p className={s.supportingText()}>{supportingText}</p>}
      {displayMode === DISPLAY_MODE.CAROUSEL ? (
        <PostsCarousel
          items={items}
          hasImages={hasImages}
          title={resolvedTitle}
          tone={brandVariant}
        />
      ) : (
        <PostGrid className={s.grid()}>
          {items.map((item) => (
            <PostCardItem key={item.id} item={item} hasImage={hasImages} />
          ))}
        </PostGrid>
      )}
    </Section>
  );
};
