import { routes, type ILocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import { Pagination, PostsSection } from '@blog/ui/organisms';
import { BlogPageTemplate } from '@web/components/pages/blog-page-template';
import { Link } from '@web/i18n/navigation';
import { CATEGORY_ITEMS_PER_PAGE } from '@web/utils/category-items-per-page';
import { formatDate } from '@web/utils/format-date';
import { notFound } from 'next/navigation';

type TCategoryPageProps = ILocalizedParams & { slug: string; page?: number };

/**
 * CategoryPage — shared composition for `/category/[slug]` (page 1,
 * unpaginated — `page` omitted) and `/category/[slug]/page/[page]` (pages
 * ≥ 2, `page` provided): fetches posts for the category and renders them
 * through the same pure ui organisms as `BlogListPage`.
 */
export async function CategoryPage({ slug, locale, page }: TCategoryPageProps) {
  const result =
    page === undefined
      ? await service.pages.category.v1.getCategoryPage(slug)
      : await service.pages.category.v1.getCategoryPage(slug, {
          page,
          itemsPerPage: CATEGORY_ITEMS_PER_PAGE,
        });

  if (!result) {
    notFound();
  }

  const { category, posts, currentPage, totalPages } = result;

  // Out-of-range page (corpus shrank or hand-typed URL) → hard 404, never a
  // soft-404 or a redirect to the last page (spec SEO rules).
  if (page !== undefined && totalPages !== undefined && page > totalPages) {
    notFound();
  }

  const items = posts.map((post) => ({
    id: post.id,
    href: routes.post(post.slug),
    title: post.title,
    excerpt: post.excerpt,
    publishedAt: post.publishedAt,
    formattedDate: formatDate(post.publishedAt, locale),
    categories: post.categories,
  }));

  return (
    <BlogPageTemplate
      heading={category.title}
      supportingText={category.description}
      posts={
        <PostsSection
          posts={items}
          title={`Posts in ${category.title}`}
          titleId="category-posts-title"
          linkAs={Link}
        />
      }
      pagination={
        currentPage !== undefined && totalPages !== undefined ? (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            createHref={(pageNumber) => routes.category(slug, pageNumber)}
            ariaLabel="Category pages"
            previousLabel="Previous"
            nextLabel="Next"
            linkAs={Link}
          />
        ) : undefined
      }
    />
  );
}
