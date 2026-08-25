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

type TTopicPageProps = { slug: string; page?: number; locale: string };

/**
 * TopicPage — shared composition for `/topics/[slug]` (page 1, `page`
 * omitted) and `/topics/[slug]/page/[page]` (pages ≥ 2, `page` provided):
 * fetches the `page_topic` shell via the topic service, renders a
 * `Home › Topic` `Breadcrumbs` trail (plus its `BreadcrumbList` JSON-LD)
 * inside a `BreadcrumbBar` sibling before `<main>`, then the archive itself
 * — via `PostListModule`, reading `page_topic.postList` — as a sibling
 * outside `BlogPageTemplate`'s constrained furniture, mirroring
 * `BlogListPage`. `topic.title`/`topic.description` (from the deref'd
 * `blog_topic`, not `page_topic`'s own CMS-label `title`) drive the heading
 * and supporting text.
 */
export const TopicPage = async ({ slug, page, locale }: TTopicPageProps) => {
  const [result, topics, breadcrumbsT, topicPageT] = await Promise.all([
    service.pages.topic.v1.getTopicPage(slug),
    getTopicsSafely(),
    getTranslations('breadcrumbs'),
    getTranslations('topicPage'),
  ]);

  if (!result.ok) {
    logger.error('topic_page.fetch_failed', { slug, error: result.error });
    notFound();
  }

  if (!result.data) {
    notFound();
  }

  const { topic, modules, postListId } = result.data;

  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? '';
  const trail: IBreadcrumbItem[] = [
    { label: breadcrumbsT('home'), href: routes.home() },
    { label: topic.title, href: routes.topic(slug) },
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
        heading={topic.title}
        supportingText={topic.description}
        topicChips={<TopicChipList topics={topics} activeSlug={slug} />}
        modules={
          <>
            <PostListModule
              id={postListId}
              locale={locale}
              page={page ?? 1}
              createHref={(pageNumber) => routes.topic(slug, pageNumber)}
              ariaLabel={topicPageT('paginationAriaLabel')}
              accessibleTitle={topicPageT('title', { name: topic.title })}
              emptyMessageFallback={topicPageT('empty', { name: topic.title })}
              titleId="topic-posts-title"
            />
            <ModuleRenderer modules={modules} locale={locale} />
          </>
        }
      />
    </>
  );
};
