import { routes } from '@blog/config';
import { service } from '@blog/service';
import type { IBreadcrumbItem } from '@blog/ui/molecules/breadcrumbs';
import { ModuleRenderer } from '@web/modules/module-renderer';
import { PostListModule } from '@web/modules/post-list/post-list-module';
import { getTenantBaseUrl } from '@web/server/tenant/get-tenant-base-url';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { getTopicsSafely } from '@web/utils/get-topics-safely';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { getTranslations } from 'next-intl/server';

import { BlogListPageView } from './blog-list-page-view';

type TBlogListPageProps = { page: number; locale: string };

/**
 * Shared composition for `/blog` (page 1) and `/blog/page/[page]` (pages ≥
 * 2): fetches the page shell via the blog service, then hands the resolved
 * data — plus the pre-rendered archive/page-builder modules content — to
 * `BlogListPageView`.
 */
export const BlogListPage = async ({ page, locale }: TBlogListPageProps) => {
  const tenant = await getTenantSanityContext();
  const [result, topics, breadcrumbsT] = await Promise.all([
    service.pages.blog.v1.getIndexPage(tenant),
    getTopicsSafely(tenant),
    getTranslations('breadcrumbs'),
  ]);

  const { heading, supportingText, modules, postListId } =
    guardPageLoaderResult(result, 'blog_list_page.fetch_failed');

  const siteUrl = (await getTenantBaseUrl()) ?? '';
  const breadcrumbTrail: IBreadcrumbItem[] = [
    { label: breadcrumbsT('home'), href: routes.home() },
    { label: breadcrumbsT('blog'), href: routes.blogIndex() },
  ];
  const breadcrumbListSchema = buildBreadcrumbListSchema(
    breadcrumbTrail,
    siteUrl,
  );

  return (
    <BlogListPageView
      heading={heading}
      supportingText={supportingText}
      topics={topics}
      breadcrumbTrail={breadcrumbTrail}
      breadcrumbAriaLabel={breadcrumbsT('ariaLabel')}
      breadcrumbListSchema={breadcrumbListSchema}
      postsContent={
        <>
          <PostListModule id={postListId} locale={locale} page={page} />
          <ModuleRenderer modules={modules} locale={locale} />
        </>
      }
    />
  );
};
