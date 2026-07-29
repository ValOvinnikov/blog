import { routes } from '@blog/config';
import type { TCategoriesList } from '@blog/service';
import { Tag } from '@blog/ui/atoms/tag';
import { SmartLink } from '@web/components/shared/smart-link';

import { categoryChipListVariants } from './category-chip-list-variants';

export interface ICategoryChipListProps {
  categories: TCategoriesList;
  /**
   * Slug of the category currently being viewed. Highlights that chip and
   * marks it `aria-current="page"`; omit on `/blog` so the "All" chip is
   * highlighted instead.
   */
  activeSlug?: string;
}

/**
 * CategoryChipList — static navigation row of category archive links plus
 * an "All" chip back to the unfiltered blog index. Renders on `/blog` (no
 * `activeSlug`, "All" highlighted) and on `/category/[slug]` archives
 * (`activeSlug` highlights the matching category chip instead). Every link
 * is a real `<a>` via `SmartLink` — SEO navigation, not a client-side filter.
 *
 * @example
 * <CategoryChipList categories={categories} activeSlug={category.slug} />
 */
export const CategoryChipList = ({
  categories,
  activeSlug,
}: ICategoryChipListProps) => {
  if (categories.length === 0) return null;

  const isAllActive = activeSlug === undefined;

  return (
    <nav aria-label="Categories" className={categoryChipListVariants()}>
      <Tag
        as={SmartLink}
        href={routes.blogIndex()}
        variant={isAllActive ? 'accent' : 'default'}
        aria-current={isAllActive ? 'page' : undefined}
      >
        All
      </Tag>
      {categories.map((category) => {
        const isActive = category.slug === activeSlug;

        return (
          <Tag
            key={category.id}
            as={SmartLink}
            href={routes.category(category.slug)}
            variant={isActive ? 'accent' : 'default'}
            aria-current={isActive ? 'page' : undefined}
          >
            {category.title}
          </Tag>
        );
      })}
    </nav>
  );
};
