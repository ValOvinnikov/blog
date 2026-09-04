import { routes } from '@blog/config';
import { service } from '@blog/service';
import type { IBreadcrumbItem } from '@blog/ui/molecules/breadcrumbs';
import { ModuleRenderer } from '@web/modules/module-renderer';
import { PostListModule } from '@web/modules/post-list/post-list-module';
import { getTenantBaseUrl } from '@web/server/tenant/get-tenant-base-url';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { getTranslations } from 'next-intl/server';

import { TagPageView } from './tag-page-view';

type TTagPageProps = {
  slug: string;
  page?: number;
  locale: string;
  tenant: string;
};

/**
 * TagPage — shared composition for `/tags/[slug]` (page 1, `page`
 * omitted) and `/tags/[slug]/page/[page]` (pages ≥ 2, `page` provided):
 * fetches the `page_tag` shell via the tag service, then hands the resolved
 * data — plus the pre-rendered archive/page-builder modules content — to
 * `TagPageView`.
 */
export const TagPage = async ({
  slug,
  page,
  locale,
  tenant,
}: TTagPageProps) => {
  const tenantContext = await getTenantSanityContext(tenant);
  const [result, breadcrumbsT, tagPageT] = await Promise.all([
    service.pages.tag.v1.getTagPage(slug, tenantContext),
    getTranslations('breadcrumbs'),
    getTranslations('tagPage'),
  ]);

  const { tag, modules, postListId } = guardPageLoaderResult(
    result,
    'tag_page.fetch_failed',
    { slug },
  );

  const siteUrl = (await getTenantBaseUrl(tenant)) ?? '';
  const breadcrumbTrail: IBreadcrumbItem[] = [
    { label: breadcrumbsT('home'), href: routes.home() },
    { label: tagPageT('label', { name: tag.title }), href: routes.tag(slug) },
  ];
  const breadcrumbListSchema = buildBreadcrumbListSchema(
    breadcrumbTrail,
    siteUrl,
  );

  return (
    <TagPageView
      heading={tag.title}
      supportingText={tag.description}
      breadcrumbTrail={breadcrumbTrail}
      breadcrumbAriaLabel={breadcrumbsT('ariaLabel')}
      breadcrumbListSchema={breadcrumbListSchema}
      postsContent={
        <>
          <PostListModule
            id={postListId}
            locale={locale}
            tenant={tenant}
            page={page ?? 1}
            createHref={(pageNumber) => routes.tag(slug, pageNumber)}
            ariaLabel={tagPageT('paginationAriaLabel', {
              name: tag.title,
            })}
            accessibleTitle={tagPageT('title', { name: tag.title })}
            emptyMessageFallback={tagPageT('empty', { name: tag.title })}
            titleId="tag-posts-title"
          />
          <ModuleRenderer modules={modules} locale={locale} tenant={tenant} />
        </>
      }
    />
  );
};
