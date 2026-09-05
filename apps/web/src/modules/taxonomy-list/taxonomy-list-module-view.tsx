import type { TTaxonomyListModule } from '@blog/service';
import { Heading } from '@blog/ui/atoms/heading';
import type { THeadingLevel } from '@blog/ui/lib/react';
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
  /** Heading depth for the section title — the caller decides based on where the module sits in the page outline. */
  headingLevel: THeadingLevel;
  /**
   * Accessible heading text used when `sectionHeader.heading` is empty or
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
  headingLevel,
  accessibleTitle,
  emptyMessage,
  contentAlignment,
}: ITaxonomyListModuleViewProps) => {
  const { heading, supportingText } = sectionHeader;
  const hasHeading = Boolean(heading?.trim());
  const resolvedTitle = hasHeading ? heading : accessibleTitle;
  const isEmpty = items.length === 0;
  const s = taxonomyListModuleViewVariants({ align: contentAlignment });

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      titleId={titleId}
      dataTestId={dataTestId}
    >
      <Heading
        level={headingLevel}
        id={titleId}
        className={hasHeading ? s.label() : s.labelFallback()}
      >
        {resolvedTitle}
      </Heading>
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
