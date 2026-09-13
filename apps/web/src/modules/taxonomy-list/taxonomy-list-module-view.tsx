import type { TTaxonomyListModule } from '@blog/service';
import type { THeadingLevel } from '@blog/ui/lib/react';
import { TaxonomyCard } from '@blog/ui/molecules/taxonomy-card';
import { PostGrid } from '@blog/ui/organisms/post-grid';
import { ModuleHeading } from '@web/components/shared/module-heading';
import { Section } from '@web/components/shared/section';
import { SmartLink } from '@web/components/shared/smart-link';

import { taxonomyListModuleViewVariants } from './taxonomy-list-module-view-variants';

type TTaxonomyListModulePost = {
  id: string;
  title: string;
  href: string;
};

export interface ITaxonomyListModuleItem {
  id: string;
  title: string;
  description?: string;
  postCountLabel: string;
  href: string;
  posts: TTaxonomyListModulePost[];
  latestPostsLabel: string;
}

export interface ITaxonomyListModuleViewProps extends Omit<
  TTaxonomyListModule,
  'entries' | 'taxonomy'
> {
  items: ITaxonomyListModuleItem[];
  titleId: string;
  dataTestId: string;
  /** Heading depth for the section title — the caller decides based on where the module sits in the page outline. */
  headingLevel: THeadingLevel;
  emptyMessage: string;
}

/**
 * TaxonomyListModuleView — render shell for `TaxonomyListModule`: a labeled
 * `Section` wrapping either a `PostGrid` of `TaxonomyCard`s or the empty
 * message. Built from primitives — `PostCardItem` is shaped around a blog
 * post, not a taxonomy entry, so no listing organism fits here.
 */
export const TaxonomyListModuleView = ({
  brandVariant,
  headingBlock,
  items,
  layout,
  titleId,
  dataTestId,
  headingLevel,
  emptyMessage,
  contentAlignment,
  showLatestPosts,
}: ITaxonomyListModuleViewProps) => {
  const isEmpty = items.length === 0;
  const s = taxonomyListModuleViewVariants();

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      titleId={titleId}
      dataTestId={dataTestId}
    >
      <ModuleHeading
        headingBlock={headingBlock}
        id={titleId}
        level={headingLevel}
        align={contentAlignment}
      />
      {isEmpty ? (
        <p className={s.emptyMessage()}>{emptyMessage}</p>
      ) : (
        <PostGrid>
          {items.map((item) => (
            <TaxonomyCard
              key={item.id}
              title={item.title}
              description={item.description}
              postCountLabel={item.postCountLabel}
              href={item.href}
              headingLevel={3}
              linkAs={SmartLink}
            >
              {showLatestPosts && item.posts.length > 0 && (
                <TaxonomyCard.Posts
                  posts={item.posts}
                  ariaLabel={item.latestPostsLabel}
                />
              )}
            </TaxonomyCard>
          ))}
        </PostGrid>
      )}
    </Section>
  );
};
