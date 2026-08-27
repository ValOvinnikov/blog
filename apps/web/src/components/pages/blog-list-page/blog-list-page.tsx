import { routes } from '@blog/config';
import { service } from '@blog/service';
import type { IBreadcrumbItem } from '@blog/ui/molecules/breadcrumbs';
import { ModuleRenderer } from '@web/modules/module-renderer';
import { PostListModule } from '@web/modules/post-list/post-list-module';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { env } from '@web/utils/env/env';
import { getTopicsSafely } from '@web/utils/get-topics-safely';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';
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
  const [result, topics, breadcrumbsT] = await Promise.all([
    service.pages.blog.v1.getIndexPage(),
    getTopicsSafely(),
    getTranslations('breadcrumbs'),
  ]);

  if (!result.ok) {
    logger.error('blog_list_page.fetch_failed', { error: result.error });
    notFound();
  }

  if (!result.data) {
    notFound();
  }

  const { heading, supportingText, modules, postListId } = result.data;

  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? '';
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
