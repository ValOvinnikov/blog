import { DISPLAY_MODE } from '@blog/config';
import type { TPostFeaturedModule } from '@blog/service';
import { PostGrid } from '@blog/ui/organisms/post-grid';
import { ModuleHeading } from '@web/components/shared/module-heading';
import {
  type IPostCardData,
  PostCardItem,
} from '@web/components/shared/post-card-item';
import { PostsCarousel } from '@web/components/shared/posts-carousel';
import { Section } from '@web/components/shared/section';

import { postFeaturedModuleViewVariants } from './post-featured-module-view-variants';

export interface IPostFeaturedModuleViewProps extends Omit<
  TPostFeaturedModule,
  'posts' | 'showImages'
> {
  items: IPostCardData[];
  titleId: string;
  dataTestId: string;
  accessibleTitle: string;
  hasImages?: boolean;
}

/**
 * PostFeaturedModuleView — render shell for `PostFeaturedModule`: a labeled
 * `Section` wrapping either a `PostsCarousel` or the default spotlight
 * arrangement — the first item as a lead `PostCardItem`, then either the one
 * remaining item (also full-width) or a two-column `PostGrid` of the rest.
 * Never called with an empty `items` — `PostFeaturedModule` renders nothing
 * itself in that case.
 */
export const PostFeaturedModuleView = ({
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
}: IPostFeaturedModuleViewProps) => {
  const s = postFeaturedModuleViewVariants();

  const { heading } = headingBlock;
  const resolvedTitle = heading?.trim() ? heading : accessibleTitle;

  const [leadPost, ...tailPosts] = items;
  const [soloTailPost] = tailPosts;

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      titleId={titleId}
      dataTestId={dataTestId}
    >
      <ModuleHeading
        headingBlock={headingBlock}
        accessibleTitle={accessibleTitle}
        id={titleId}
        level={2}
        align={contentAlignment}
      />
      {leadPost && displayMode === DISPLAY_MODE.CAROUSEL && (
        <PostsCarousel
          items={items}
          hasImages={hasImages}
          ariaLabel={resolvedTitle}
          tone={brandVariant}
        />
      )}
      {leadPost && displayMode !== DISPLAY_MODE.CAROUSEL && (
        <div className={s.leadGroup()}>
          <PostCardItem
            item={leadPost}
            isLead={true}
            isSplit={true}
            hasImage={hasImages}
            dataTestId={`${dataTestId}-lead`}
          />
          {tailPosts.length === 1 && soloTailPost && (
            <PostCardItem
              item={soloTailPost}
              isSplit={true}
              hasImage={hasImages}
              dataTestId={`${dataTestId}-tail`}
            />
          )}
          {tailPosts.length > 1 && (
            <PostGrid
              columns={2}
              className={s.grid()}
              dataTestId={`${dataTestId}-tail-grid`}
            >
              {tailPosts.map((post) => (
                <PostCardItem key={post.id} item={post} hasImage={hasImages} />
              ))}
            </PostGrid>
          )}
        </div>
      )}
    </Section>
  );
};
