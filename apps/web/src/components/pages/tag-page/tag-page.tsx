import { routes } from '@blog/config';
import { createLogger } from '@blog/insight';
import { service } from '@blog/service';
import { Breadcrumbs, type IBreadcrumbItem } from '@blog/ui/molecules';
import { Pagination, PostsSection } from '@blog/ui/organisms';
import { BlogPageTemplate } from '@web/components/page-templates/blog-page-template';
import { BreadcrumbBar } from '@web/components/shared/breadcrumb-bar';
import { JsonLd } from '@web/components/shared/json-ld';
import { SmartLink } from '@web/components/shared/smart-link';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { env } from '@web/utils/env/env';
import { TAG_ITEMS_PER_PAGE } from '@web/utils/tag-items-per-page';
import { toPostListItems } from '@web/utils/to-post-list-items';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

type TTagPageProps = { slug: string; page?: number };

const logger = createLogger();

/**
 * TagPage — shared composition for `/tag/[slug]` (page 1, `page` omitted)
 * and `/tag/[slug]/page/[page]` (pages ≥ 2, `page` provided): fetches posts
 * for the tag, renders a `Home › Tag: {name}` `Breadcrumbs` trail (plus its
 * `BreadcrumbList` JSON-LD) inside a `BreadcrumbBar` sibling before `<main>`,
 * then renders the posts through the same pure ui organisms as
 * `CategoryPage`. `getTagPage` always windows — page 1 gets the same
 * pagination metadata as any other page.
 */
export async function TagPage({ slug, page }: TTagPageProps) {
  const [result, t, breadcrumbsT, tagPageT] = await Promise.all([
    service.pages.tag.v1.getTagPage(slug, {
      page,
      itemsPerPage: TAG_ITEMS_PER_PAGE,
    }),
    getTranslations('pagination'),
    getTranslations('breadcrumbs'),
    getTranslations('tagPage'),
  ]);

  if (!result.ok) {
    logger.error('tag_page.fetch_failed', { slug, error: result.error });
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
    { label: tagPageT('label', { name: tag.title }), href: routes.tag(slug) },
  ];
  const breadcrumbListSchema = buildBreadcrumbListSchema(trail, siteUrl);

  return (
    <>
      {breadcrumbListSchema && <JsonLd schema={breadcrumbListSchema} />}

      <BreadcrumbBar>
        <Breadcrumbs
          items={trail}
          ariaLabel={breadcrumbsT('ariaLabel')}
          linkAs={SmartLink}
        />
      </BreadcrumbBar>

      <BlogPageTemplate
        heading={tag.title}
        supportingText={tag.description}
        posts={
          <PostsSection
            posts={items}
            title={tagPageT('title', { name: tag.title })}
            titleId="tag-posts-title"
            linkAs={SmartLink}
            emptyMessage={tagPageT('empty', { name: tag.title })}
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
