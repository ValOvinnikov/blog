import { routes } from '@blog/config';
import { service } from '@blog/service';
import { Breadcrumbs, type IBreadcrumbItem } from '@blog/ui/molecules';
import { Pagination, PostsSection } from '@blog/ui/organisms';
import { BlogPageTemplate } from '@web/components/page-templates/blog-page-template';
import { BreadcrumbBar } from '@web/components/shared/breadcrumb-bar';
import { CategoryChipList } from '@web/components/shared/category-chip-list';
import { JsonLd } from '@web/components/shared/json-ld';
import { SmartLink } from '@web/components/shared/smart-link';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { CATEGORY_ITEMS_PER_PAGE } from '@web/utils/category-items-per-page';
import { env } from '@web/utils/env/env';
import { getCategoriesSafely } from '@web/utils/get-categories-safely';
import { toPostListItems } from '@web/utils/to-post-list-items';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

type TCategoryPageProps = { slug: string; page?: number };

/**
 * CategoryPage — shared composition for `/category/[slug]` (page 1, `page`
 * omitted) and `/category/[slug]/page/[page]` (pages ≥ 2, `page` provided):
 * fetches posts for the category, renders a `Home › Category` `Breadcrumbs`
 * trail (plus its `BreadcrumbList` JSON-LD) inside a `BreadcrumbBar` sibling
 * before `<main>`, then renders the posts through the same pure ui
 * organisms as `BlogListPage`. `getCategoryPage` always windows — page 1
 * gets the same pagination metadata as any other page.
 */
export async function CategoryPage({ slug, page }: TCategoryPageProps) {
  const [result, categories, t, breadcrumbsT, categoryPageT] =
    await Promise.all([
      service.pages.category.v1.getCategoryPage(slug, {
        page,
        itemsPerPage: CATEGORY_ITEMS_PER_PAGE,
      }),
      getCategoriesSafely(),
      getTranslations('pagination'),
      getTranslations('breadcrumbs'),
      getTranslations('categoryPage'),
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

  const items = await toPostListItems(posts);

  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? '';
  const trail: IBreadcrumbItem[] = [
    { label: breadcrumbsT('home'), href: routes.home() },
    { label: category.title, href: routes.category(slug) },
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
        heading={category.title}
        supportingText={category.description}
        categoryChips={
          <CategoryChipList categories={categories} activeSlug={slug} />
        }
        posts={
          <PostsSection
            posts={items}
            title={categoryPageT('title', { name: category.title })}
            titleId="category-posts-title"
            linkAs={SmartLink}
            emptyMessage={categoryPageT('empty', { name: category.title })}
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
            linkAs={SmartLink}
          />
        }
      />
    </>
  );
}
