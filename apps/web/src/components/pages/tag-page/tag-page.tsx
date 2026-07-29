import { routes } from '@blog/config';
import { service } from '@blog/service';
import { Breadcrumbs, type IBreadcrumbItem } from '@blog/ui/molecules';
import { Pagination, PostsSection } from '@blog/ui/organisms';
import { BlogPageTemplate } from '@web/components/page-templates/blog-page-template';
import { JsonLd } from '@web/components/shared/json-ld';
import { SmartLink } from '@web/components/shared/smart-link';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { env } from '@web/utils/env/env';
import { TAG_ITEMS_PER_PAGE } from '@web/utils/tag-items-per-page';
import { toPostListItems } from '@web/utils/to-post-list-items';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

type TTagPageProps = { slug: string; page?: number };

/**
 * TagPage — shared composition for `/tag/[slug]` (page 1, `page` omitted)
 * and `/tag/[slug]/page/[page]` (pages ≥ 2, `page` provided): fetches posts
 * for the tag, renders a `Home › Tag: {name}` `Breadcrumbs` trail (plus its
 * `BreadcrumbList` JSON-LD) as page chrome above the archive content, then
 * renders the posts through the same pure ui organisms as `CategoryPage`.
 * `getTagPage` always windows — page 1 gets the same pagination metadata as
 * any other page.
 */
export async function TagPage({ slug, page }: TTagPageProps) {
  const [result, t, breadcrumbsT] = await Promise.all([
    service.pages.tag.v1.getTagPage(slug, {
      page,
      itemsPerPage: TAG_ITEMS_PER_PAGE,
    }),
    getTranslations('pagination'),
    getTranslations('breadcrumbs'),
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

  const items = await toPostListItems(posts);

  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? '';
  const trail: IBreadcrumbItem[] = [
    { label: breadcrumbsT('home'), href: routes.home() },
    { label: `Tag: ${tag.title}`, href: routes.tag(slug) },
  ];
  const breadcrumbListSchema = buildBreadcrumbListSchema(trail, siteUrl);

  return (
    <>
      {breadcrumbListSchema && <JsonLd schema={breadcrumbListSchema} />}

      <BlogPageTemplate
        heading={tag.title}
        breadcrumbs={
          <Breadcrumbs
            items={trail}
            ariaLabel={breadcrumbsT('ariaLabel')}
            linkAs={SmartLink}
          />
        }
        supportingText={tag.description}
        posts={
          <PostsSection
            posts={items}
            title={`Posts tagged ${tag.title}`}
            titleId="tag-posts-title"
            linkAs={SmartLink}
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
            linkAs={SmartLink}
          />
        }
      />
    </>
  );
}
