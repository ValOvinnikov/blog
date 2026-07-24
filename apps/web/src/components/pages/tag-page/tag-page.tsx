import { routes, type ILocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import { Pagination, PostsSection } from '@blog/ui/organisms';
import { BlogPageTemplate } from '@web/components/pages/blog-page-template';
import { Link } from '@web/i18n/navigation';
import { TAG_ITEMS_PER_PAGE } from '@web/utils/tag-items-per-page';
import { toPostListItems } from '@web/utils/to-post-list-items';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

type TTagPageProps = ILocalizedParams & { slug: string; page?: number };

/**
 * TagPage — shared composition for `/tag/[slug]` (page 1, `page` omitted)
 * and `/tag/[slug]/page/[page]` (pages ≥ 2, `page` provided): fetches posts
 * for the tag and renders them through the same pure ui organisms as
 * `CategoryPage`. `getTagPage` always windows — page 1 gets the same
 * pagination metadata as any other page.
 */
export async function TagPage({ slug, locale, page }: TTagPageProps) {
  const [result, t] = await Promise.all([
    service.pages.tag.v1.getTagPage(slug, {
      page,
      itemsPerPage: TAG_ITEMS_PER_PAGE,
    }),
    getTranslations('pagination'),
  ]);

  if (!result.ok) {
    console.error(`Error to fetch tag page: ${result.error}`);
    notFound();
  }
  if (result.data === null) {
    notFound();
  }

  const { tag, posts, currentPage, totalPages } = result.data;

  // Out-of-range page (corpus shrank or hand-typed URL) → hard 404, never a
  // soft-404 or a redirect to the last page (spec SEO rules).
  if (page !== undefined && page > totalPages) {
    notFound();
  }

  const items = toPostListItems(posts, locale);

  return (
    <BlogPageTemplate
      heading={tag.title}
      supportingText={tag.description}
      posts={
        <PostsSection
          posts={items}
          title={`Posts tagged ${tag.title}`}
          titleId="tag-posts-title"
          linkAs={Link}
          emptyMessage={`No posts tagged ${tag.title} yet.`}
        />
      }
      pagination={
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          createHref={(pageNumber) => routes.tag(slug, pageNumber)}
          ariaLabel={t('ariaLabel', { pageType: 'Tag' })}
          previousLabel={t('previous')}
          nextLabel={t('next')}
          linkAs={Link}
        />
      }
    />
  );
}
