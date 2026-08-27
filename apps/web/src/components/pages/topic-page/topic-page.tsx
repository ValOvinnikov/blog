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

import { TopicPageView } from './topic-page-view';

type TTopicPageProps = { slug: string; page?: number; locale: string };

/**
 * TopicPage — shared composition for `/topics/[slug]` (page 1, `page`
 * omitted) and `/topics/[slug]/page/[page]` (pages ≥ 2, `page` provided):
 * fetches the `page_topic` shell via the topic service, then hands the
 * resolved data — plus the pre-rendered archive/page-builder modules
 * content — to `TopicPageView`. `topic.title`/`topic.description` (from the
 * deref'd `blog_topic`, not `page_topic`'s own CMS-label `title`) drive the
 * heading and supporting text.
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
  const breadcrumbTrail: IBreadcrumbItem[] = [
    { label: breadcrumbsT('home'), href: routes.home() },
    { label: topic.title, href: routes.topic(slug) },
  ];
  const breadcrumbListSchema = buildBreadcrumbListSchema(
    breadcrumbTrail,
    siteUrl,
  );

  return (
    <TopicPageView
      heading={topic.title}
      supportingText={topic.description}
      topics={topics}
      activeSlug={slug}
      breadcrumbTrail={breadcrumbTrail}
      breadcrumbAriaLabel={breadcrumbsT('ariaLabel')}
      breadcrumbListSchema={breadcrumbListSchema}
      postsContent={
        <>
          <PostListModule
            id={postListId}
            locale={locale}
            page={page ?? 1}
            createHref={(pageNumber) => routes.topic(slug, pageNumber)}
            ariaLabel={topicPageT('paginationAriaLabel', {
              name: topic.title,
            })}
            accessibleTitle={topicPageT('title', { name: topic.title })}
            emptyMessageFallback={topicPageT('empty', { name: topic.title })}
            titleId="topic-posts-title"
          />
          <ModuleRenderer modules={modules} locale={locale} />
        </>
      }
    />
  );
};
