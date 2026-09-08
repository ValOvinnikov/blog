import { BRAND_VARIANT, CONTAINER_WIDTH, SPACING_SCALE } from '@blog/config';
import { Heading } from '@blog/ui/atoms/heading';
import { PostGrid } from '@blog/ui/organisms/post-grid';
import { PostCardItem } from '@web/components/shared/post-card-item';
import { Section } from '@web/components/shared/section';
import { getPostPage } from '@web/server/post/get-post-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { renderPostCardImage } from '@web/utils/render-post-card-image';
import { toPostListItems } from '@web/utils/to-post-list-items';
import { getTranslations } from 'next-intl/server';

import { postRelatedVariants } from './post-related-variants';

export type TPostRelatedProps = {
  slug: string;
  tenant: string;
};

const TITLE_ID = 'related-posts-title';

const s = postRelatedVariants();

/** Renders the post's related-reading listing; renders nothing when it has no related posts. */
export const PostRelated = async ({ slug, tenant }: TPostRelatedProps) => {
  const result = await getPostPage(slug, tenant);
  const post = guardPageLoaderResult(result, 'post_related.fetch_failed', {
    slug,
  });
  const { relatedPosts } = post;
  if (relatedPosts.length === 0) return null;

  const [items, t] = await Promise.all([
    toPostListItems(relatedPosts, renderPostCardImage),
    getTranslations('blogPostPage'),
  ]);

  return (
    <Section
      brandVariant={BRAND_VARIANT.PRIMARY}
      layout={{
        spacingTop: SPACING_SCALE.LG,
        spacingBottom: SPACING_SCALE.LG,
        containerWidth: CONTAINER_WIDTH.FULL,
        dividerTop: true,
      }}
      titleId={TITLE_ID}
    >
      <Heading level={2} id={TITLE_ID} className={s.label()}>
        {t('relatedReading')}
      </Heading>
      <PostGrid className={s.grid()}>
        {items.map((item) => (
          <PostCardItem key={item.id} item={item} hasImage={true} />
        ))}
      </PostGrid>
    </Section>
  );
};
