import type { TTaxonomyListModule } from '@blog/service';
import type { THeadingLevel } from '@blog/ui/lib/react';
import { TaxonomyCard } from '@blog/ui/molecules/taxonomy-card';
import { PostGrid } from '@blog/ui/organisms/post-grid';
import { ModuleHeading } from '@web/components/shared/module-heading';
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
  'entries' | 'taxonomy'
> {
  items: ITaxonomyListModuleItem[];
  titleId: string;
  dataTestId: string;
  /** Heading depth for the section title — the caller decides based on where the module sits in the page outline. */
  headingLevel: THeadingLevel;
  /**
   * Accessible heading text used when `headingBlock.heading` is empty or
   * blank, so the section keeps a landmark name and the page's heading
   * outline stays intact. Rendered visually hidden — pass an i18n string,
   * never invent one here.
   */
  accessibleTitle: string;
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
  accessibleTitle,
  emptyMessage,
  contentAlignment,
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
        heading={headingBlock.heading}
        supportingText={headingBlock.supportingText}
        accessibleTitle={accessibleTitle}
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
            />
          ))}
        </PostGrid>
      )}
    </Section>
  );
};
