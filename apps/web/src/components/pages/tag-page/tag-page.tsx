import { routes, type ILocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import { Pagination, PostsSection } from '@blog/ui/organisms';
import { BlogPageTemplate } from '@web/components/pages/blog-page-template';
import { Link } from '@web/i18n/navigation';
import { formatDate } from '@web/utils/format-date';
import { TAG_ITEMS_PER_PAGE } from '@web/utils/tag-items-per-page';
import { notFound } from 'next/navigation';

type TTagPageProps = ILocalizedParams & { slug: string; page?: number };

/**
 * TagPage — shared composition for `/tag/[slug]` (page 1, unpaginated —
 * `page` omitted) and `/tag/[slug]/page/[page]` (pages ≥ 2, `page`
 * provided): fetches posts for the tag and renders them through the same
 * pure ui organisms as `CategoryPage`.
 */
export async function TagPage({ slug, locale, page }: TTagPageProps) {
  const result =
    page === undefined
      ? await service.pages.tag.v1.getTagPage(slug)
      : await service.pages.tag.v1.getTagPage(slug, {
          page,
          itemsPerPage: TAG_ITEMS_PER_PAGE,
        });

  if (!result) {
    notFound();
  }

  const { tag, posts, currentPage, totalPages } = result;

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
      heading={tag.title}
      supportingText={tag.description}
      posts={
        <PostsSection
          posts={items}
          title={`Posts tagged ${tag.title}`}
          titleId="tag-posts-title"
          linkAs={Link}
        />
      }
      pagination={
        currentPage !== undefined && totalPages !== undefined ? (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            createHref={(pageNumber) => routes.tag(slug, pageNumber)}
            ariaLabel="Tag pages"
            previousLabel="Previous"
            nextLabel="Next"
            linkAs={Link}
          />
        ) : undefined
      }
    />
  );
}
