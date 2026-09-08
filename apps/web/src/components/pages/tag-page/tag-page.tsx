import { routes } from '@blog/config';
import { TagBreadcrumbs } from '@web/components/features/tag/tag-breadcrumbs';
import { BlogPageTemplate } from '@web/components/page-templates/blog-page-template';
import { HeroSlot } from '@web/modules/hero-slot';
import { ModuleRenderer } from '@web/modules/module-renderer';
import { PostListModule } from '@web/modules/post-list/post-list-module';
import { getTagPage } from '@web/server/tag/get-tag-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { getTranslations } from 'next-intl/server';

type TTagPageProps = {
  slug: string;
  page?: number;
  locale: string;
  tenant: string;
};

/**
 * TagPage — shared composition for `/tags/[slug]` (page 1, `page`
 * omitted) and `/tags/[slug]/page/[page]` (pages ≥ 2, `page` provided).
 * Fetches the `page_tag` shell once, then composes every other concern
 * as a self-fetching part reading the same cached `getTagPage` loader.
 */
export const TagPage = async ({
  slug,
  page,
  locale,
  tenant,
}: TTagPageProps) => {
  const result = await getTagPage(slug, tenant);
  const pageData = guardPageLoaderResult(result, 'tag_page.fetch_failed', {
    slug,
  });
  const { tag, hero, modules, postListId } = pageData;

  const tagPageT = await getTranslations('tagPage');

  return (
    <>
      <TagBreadcrumbs slug={slug} tenant={tenant} />

      <BlogPageTemplate
        heading={tag.title}
        supportingText={tag.description}
        hero={
          hero && (
            <HeroSlot
              id={hero.id}
              type={hero.type}
              locale={locale}
              tenant={tenant}
            />
          )
        }
        modules={
          <>
            <PostListModule
              id={postListId}
              locale={locale}
              tenant={tenant}
              page={page ?? 1}
              createHref={(pageNumber) => routes.tag(slug, pageNumber)}
              ariaLabel={tagPageT('paginationAriaLabel', { name: tag.title })}
              accessibleTitle={tagPageT('title', { name: tag.title })}
              emptyMessageFallback={tagPageT('empty', { name: tag.title })}
              titleId="tag-posts-title"
            />
            <ModuleRenderer modules={modules} locale={locale} tenant={tenant} />
          </>
        }
      />
    </>
  );
};
