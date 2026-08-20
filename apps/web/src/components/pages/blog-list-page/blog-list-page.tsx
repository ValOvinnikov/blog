import { routes } from '@blog/config';
import { service } from '@blog/service';
import { Breadcrumbs, type IBreadcrumbItem } from '@blog/ui/molecules';
import { Pagination, PostsSection } from '@blog/ui/organisms';
import { BlogPageTemplate } from '@web/components/page-templates/blog-page-template';
import { BreadcrumbBar } from '@web/components/shared/breadcrumb-bar';
import { JsonLd } from '@web/components/shared/json-ld';
import { SmartLink } from '@web/components/shared/smart-link';
import { TopicChipList } from '@web/components/shared/topic-chip-list';
import { ModuleRenderer } from '@web/modules/module-renderer';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { env } from '@web/utils/env/env';
import { getTopicsSafely } from '@web/utils/get-topics-safely';
import { logger } from '@web/utils/logger/logger';
import { toPostListItems } from '@web/utils/to-post-list-items';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

type TBlogListPageProps = { page: number; locale: string };

/**
 * Shared composition for `/blog` (page 1) and `/blog/page/[page]` (pages ≥
 * 2): fetches one page window via the blog service, renders a `Home ›
 * Blog` `Breadcrumbs` trail (plus its `BreadcrumbList` JSON-LD) inside a
 * `BreadcrumbBar` sibling before `<main>`, then renders the archive content
 * through the pure ui organisms. Any editor-added page-builder modules
 * (`page_blog.modules`) render last, through the same `ModuleRenderer` the
 * home page uses — no hardcoded placement.
 */
export async function BlogListPage({ page, locale }: TBlogListPageProps) {
  const [result, topics, t, breadcrumbsT, blogListT] = await Promise.all([
    service.pages.blog.v1.getIndexPage({ page }),
    getTopicsSafely(),
    getTranslations('pagination'),
    getTranslations('breadcrumbs'),
    getTranslations('blogListPage'),
  ]);

  if (!result.ok) {
    logger.error('blog_list_page.fetch_failed', { page, error: result.error });
    notFound();
  }

  const { heading, supportingText, modules, posts, currentPage, totalPages } =
    result.data;

  // Out-of-range page (corpus shrank or hand-typed URL) → hard 404, never a
  // soft-404 or a redirect to the last page (spec SEO rules).
  if (page > totalPages) {
    notFound();
  }

  const items = await toPostListItems(posts);

  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? '';
  const trail: IBreadcrumbItem[] = [
    { label: breadcrumbsT('home'), href: routes.home() },
    { label: breadcrumbsT('blog'), href: routes.blogIndex() },
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
        heading={heading}
        supportingText={supportingText}
        topicChips={<TopicChipList topics={topics} />}
        posts={
          <PostsSection
            posts={items}
            title={blogListT('title')}
            titleId="blog-posts-title"
            linkAs={SmartLink}
            emptyMessage={blogListT('empty')}
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
            linkAs={SmartLink}
          />
        }
        modules={<ModuleRenderer modules={modules} locale={locale} />}
      />
    </>
  );
}
