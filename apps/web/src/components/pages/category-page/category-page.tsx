import { routes, type ILocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import { Pagination, PostsSection } from '@blog/ui/organisms';
import { BlogPageTemplate } from '@web/components/pages/blog-page-template';
import { CategoryChipList } from '@web/components/shared/category-chip-list';
import { Link } from '@web/i18n/navigation';
import { CATEGORY_ITEMS_PER_PAGE } from '@web/utils/category-items-per-page';
import { getCategoriesSafely } from '@web/utils/get-categories-safely';
import { toPostListItems } from '@web/utils/to-post-list-items';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

type TCategoryPageProps = ILocalizedParams & { slug: string; page?: number };

/**
 * CategoryPage — shared composition for `/category/[slug]` (page 1, `page`
 * omitted) and `/category/[slug]/page/[page]` (pages ≥ 2, `page` provided):
 * fetches posts for the category and renders them through the same pure ui
 * organisms as `BlogListPage`. `getCategoryPage` always windows — page 1
 * gets the same pagination metadata as any other page.
 */
export async function CategoryPage({ slug, locale, page }: TCategoryPageProps) {
  const [result, categories, t] = await Promise.all([
    service.pages.category.v1.getCategoryPage(slug, {
      page,
      itemsPerPage: CATEGORY_ITEMS_PER_PAGE,
    }),
    getCategoriesSafely(),
    getTranslations('pagination'),
  ]);

  if (!result.ok) {
    console.error(`Error to fetch category page: ${result.error}`);
    notFound();
  }
  if (result.data === null) {
    notFound();
  }

  const { category, posts, currentPage, totalPages } = result.data;

  // Out-of-range page (corpus shrank or hand-typed URL) → hard 404, never a
  // soft-404 or a redirect to the last page (spec SEO rules).
  if (page !== undefined && page > totalPages) {
    notFound();
  }

  const items = toPostListItems(posts, locale);

  return (
    <BlogPageTemplate
      heading={category.title}
      supportingText={category.description}
      categoryChips={
        <CategoryChipList categories={categories} activeSlug={slug} />
      }
      posts={
        <PostsSection
          posts={items}
          title={`Posts in ${category.title}`}
          titleId="category-posts-title"
          linkAs={Link}
          emptyMessage={`No posts in ${category.title} yet.`}
        />
      }
      pagination={
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          createHref={(pageNumber) => routes.category(slug, pageNumber)}
          ariaLabel={t('ariaLabel', { pageType: 'Category' })}
          previousLabel={t('previous')}
          nextLabel={t('next')}
          linkAs={Link}
        />
      }
    />
  );
}
