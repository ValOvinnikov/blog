import { routes } from '@blog/config';
import { service } from '@blog/service';
import {
  Breadcrumbs,
  type IBreadcrumbItem,
} from '@blog/ui/molecules/breadcrumbs';
import { BlogPageTemplate } from '@web/components/page-templates/blog-page-template';
import { BreadcrumbBar } from '@web/components/shared/breadcrumb-bar';
import { JsonLd } from '@web/components/shared/json-ld';
import { SmartLink } from '@web/components/shared/smart-link';
import { TopicChipList } from '@web/components/shared/topic-chip-list';
import { ModuleRenderer } from '@web/modules/module-renderer';
import { PostListModule } from '@web/modules/post-list/post-list-module';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { env } from '@web/utils/env/env';
import { getTopicsSafely } from '@web/utils/get-topics-safely';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

type TBlogListPageProps = { page: number; locale: string };

/**
 * Shared composition for `/blog` (page 1) and `/blog/page/[page]` (pages ≥
 * 2): fetches the page shell via the blog service, renders a `Home › Blog`
 * `Breadcrumbs` trail (plus its `BreadcrumbList` JSON-LD) inside a
 * `BreadcrumbBar` sibling before `<main>`, then the archive itself — via
 * `PostListModule`, reading `page_blog.postList` — as a sibling outside
 * `BlogPageTemplate`'s constrained furniture, in the same position editor-
 * added `page_blog.modules` occupy. Both render through their own full-
 * bleed `Section`, matching every other module.
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
        modules={
          <>
            <PostListModule id={postListId} locale={locale} page={page} />
            <ModuleRenderer modules={modules} locale={locale} />
          </>
        }
      />
    </>
  );
};
