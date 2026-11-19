import { TEXT_ROLE } from '@shinefold/config';
import type { TTaxonomyListModule } from '@shinefold/service';
import { Text } from '@shinefold/ui/components/atoms/text';
import { TaxonomyCard } from '@shinefold/ui/components/molecules/taxonomy-card';
import { CardGrid } from '@shinefold/ui/components/organisms/card-grid';
import type { THeadingLevel } from '@shinefold/ui/lib/react';
import { hasLength } from '@shinefold/utils/primitives';
import { ModuleHeading } from '@web/components/shared/module-heading';
import { Section, type TModuleSection } from '@web/components/shared/section';
import { SmartLink } from '@web/components/shared/smart-link';
import type { ReactNode } from 'react';

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
  'entries' | 'taxonomy' | 'brandVariant' | 'layout'
> {
  section: TModuleSection;
  items: ITaxonomyListModuleItem[];
  titleId: string;
  dataTestId: string;
  headingLevel: THeadingLevel;
  emptyMessage: ReactNode;
  latestLabel: string;
}

/**
 * Built from primitives — `MediaCardItem` is shaped around a blog post, not
 * a taxonomy entry, so no listing organism fits here.
 */
export const TaxonomyListModuleView = ({
  section,
  headingBlock,
  items,
  titleId,
  dataTestId,
  headingLevel,
  emptyMessage,
  contentAlignment,
  showLatestPosts,
  latestLabel,
}: ITaxonomyListModuleViewProps) => {
  const { brandVariant, layout, appearance } = section;
  const isEmpty = !hasLength(items);

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
        level={headingLevel}
        align={contentAlignment}
      />
      {isEmpty ? (
        <Text textRole={TEXT_ROLE.CARD_BODY}>{emptyMessage}</Text>
      ) : (
        <CardGrid>
          {items.map((item) => (
            <TaxonomyCard
              key={item.id}
              title={item.title}
              description={item.description}
              postCountLabel={item.postCountLabel}
              href={item.href}
              headingLevel={3}
              linkAs={SmartLink}
              isInteractive={Boolean(item.href)}
            >
              {showLatestPosts && hasLength(item.posts) && (
                <TaxonomyCard.Posts
                  posts={item.posts}
                  ariaLabel={item.latestPostsLabel}
                  label={latestLabel}
                />
              )}
            </TaxonomyCard>
          ))}
        </CardGrid>
      )}
    </Section>
  );
};
