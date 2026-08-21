import type { TTaxonomyListModule } from '@blog/service';
import { TaxonomyCard } from '@blog/ui/molecules/taxonomy-card';
import { PostGrid } from '@blog/ui/organisms/post-grid';
import { Section } from '@web/components/shared/section';
import { SmartLink } from '@web/components/shared/smart-link';

import { taxonomyListModuleViewVariants } from './taxonomy-list-module-view-variants';

export interface ITaxonomyListModuleItem {
  id: string;
  title: string;
  description?: string;
  postCountLabel: string;
  href: string;
}

export interface ITaxonomyListModuleViewProps extends Omit<
  TTaxonomyListModule,
  'entries'
> {
  items: ITaxonomyListModuleItem[];
  titleId: string;
  dataTestId: string;
  titleFallback: string;
  emptyMessage: string;
}

/**
 * TaxonomyListModuleView — render shell for `TaxonomyListModule`: a labeled
 * `Section` wrapping either a `PostGrid` of `TaxonomyCard`s or the empty
 * message. Built from primitives rather than `PostsSection` — that organism
 * is shaped around `PostCard`, not a taxonomy entry.
 */
export const TaxonomyListModuleView = ({
  brandVariant,
  sectionHeader,
  items,
  layout,
  titleId,
  dataTestId,
  titleFallback,
  emptyMessage,
}: ITaxonomyListModuleViewProps) => {
  const { heading, supportingText, align } = sectionHeader;
  const hasHeading = Boolean(heading?.trim());
  const accessibleTitle = hasHeading ? heading : titleFallback;
  const isEmpty = items.length === 0;
  const s = taxonomyListModuleViewVariants({ align });

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      titleId={titleId}
      dataTestId={dataTestId}
    >
      <h2 id={titleId} className={hasHeading ? s.label() : s.labelFallback()}>
        {accessibleTitle}
      </h2>
      {supportingText && <p className={s.supportingText()}>{supportingText}</p>}
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
            />
          ))}
        </PostGrid>
      )}
    </Section>
  );
};
