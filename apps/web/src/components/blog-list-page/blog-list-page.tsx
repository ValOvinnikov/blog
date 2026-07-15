import { routes } from '@blog/config';
import { service } from '@blog/service';
import { Pagination, PostsSection } from '@blog/ui';
import { BlogPageTemplate } from '@web/components/blog-page-template/blog-page-template';
import { Link } from '@web/i18n/navigation';
import { formatDate } from '@web/utils/format-date';
import { notFound } from 'next/navigation';

export interface IBlogListPageProps {
  /** 1-based, already validated as a canonical positive integer. */
  page: number;
  locale: string;
}

/**
 * BlogListPage — shared composition for `/blog` (page 1) and
 * `/blog/page/[page]` (pages ≥ 2): fetches one page window via the blog
 * service and renders it through the pure ui organisms.
 */
export async function BlogListPage({ page, locale }: IBlogListPageProps) {
  const result = await service.pages.blog.v1.getBlogPage({ page });

  if (!result.ok) {
    console.error(`Error to fetch blog page: ${result.error}`);
    notFound();
  }

  const { posts, currentPage, totalPages } = result.data;

  // Out-of-range page (corpus shrank or hand-typed URL) → hard 404, never a
  // soft-404 or a redirect to the last page (spec SEO rules).
  if (page > totalPages) {
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
      heading="Blog"
      posts={
        <PostsSection
          posts={items}
          title="All posts"
          titleId="blog-posts-title"
          linkAs={Link}
        />
      }
      pagination={
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          createHref={routes.blogIndex}
          ariaLabel="Blog pages"
          previousLabel="Previous"
          nextLabel="Next"
          linkAs={Link}
        />
      }
    />
  );
}
