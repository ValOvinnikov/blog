import type { TPostFeaturedModule } from '@blog/service';
import { Heading } from '@blog/ui/atoms/heading';
import { PostGrid } from '@blog/ui/organisms/post-grid';
import {
  type IPostCardData,
  PostCardItem,
} from '@web/components/shared/post-card-item';
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
 * `Section` wrapping a spotlight arrangement — the first item as a lead
 * `PostCardItem`, then either the one remaining item (also full-width) or a
 * two-column `PostGrid` of the rest. Never called with an empty `items` —
 * `PostFeaturedModule` renders nothing itself in that case.
 */
export const PostFeaturedModuleView = ({
  brandVariant,
  sectionHeader,
  items,
  layout,
  titleId,
  dataTestId,
  accessibleTitle,
  contentAlignment,
  hasImages,
}: IPostFeaturedModuleViewProps) => {
  const { heading, supportingText } = sectionHeader;
  const hasHeading = Boolean(heading?.trim());
  const resolvedTitle = hasHeading ? heading : accessibleTitle;
  const s = postFeaturedModuleViewVariants({ align: contentAlignment });

  const [leadPost, ...tailPosts] = items;
  const [soloTailPost] = tailPosts;

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
      {leadPost && (
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
