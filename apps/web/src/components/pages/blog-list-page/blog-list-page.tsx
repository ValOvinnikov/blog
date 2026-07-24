import { routes } from '@blog/config';
import { service } from '@blog/service';
import { Pagination, PostsSection } from '@blog/ui/organisms';
import { BlogPageTemplate } from '@web/components/pages/blog-page-template';
import { CategoryChipList } from '@web/components/shared/category-chip-list';
import { Link } from '@web/i18n/navigation';
import { getCategoriesSafely } from '@web/utils/get-categories-safely';
import { toPostListItems } from '@web/utils/to-post-list-items';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

type TBlogListPageProps = { page: number };

/**
 * BlogListPage — shared composition for `/blog` (page 1) and
 * `/blog/page/[page]` (pages ≥ 2): fetches one page window via the blog
 * service and renders it through the pure ui organisms.
 */
export async function BlogListPage({ page }: TBlogListPageProps) {
  const [result, categories, t] = await Promise.all([
    service.pages.blog.v1.getIndexPage({ page }),
    getCategoriesSafely(),
    getTranslations('pagination'),
  ]);

  if (!result.ok) {
    console.error(`Error to fetch blog page: ${result.error}`);
    notFound();
  }

  const { heading, supportingText, posts, currentPage, totalPages } =
    result.data;

  // Out-of-range page (corpus shrank or hand-typed URL) → hard 404, never a
  // soft-404 or a redirect to the last page (spec SEO rules).
  if (page > totalPages) {
    notFound();
  }

  const items = await toPostListItems(posts);

  return (
    <BlogPageTemplate
      heading={heading}
      supportingText={supportingText}
      categoryChips={<CategoryChipList categories={categories} />}
      posts={
        <PostsSection
          posts={items}
          title="All posts"
          titleId="blog-posts-title"
          linkAs={Link}
          emptyMessage="No posts yet."
        />
      }
      pagination={
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          createHref={routes.blogIndex}
          ariaLabel={t('ariaLabel', { pageType: 'Blog' })}
          previousLabel={t('previous')}
          nextLabel={t('next')}
          linkAs={Link}
        />
      }
    />
  );
}
