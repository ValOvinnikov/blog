import { routes } from '@blog/config';
import { TopicBreadcrumbs } from '@web/components/features/topic/topic-breadcrumbs';
import { TopicChips } from '@web/components/features/topic/topic-chips';
import { BlogPageTemplate } from '@web/components/page-templates/blog-page-template';
import { HeroSlot } from '@web/modules/hero-slot';
import { ModuleRenderer } from '@web/modules/module-renderer';
import { PostListModule } from '@web/modules/post-list/post-list-module';
import { getTopicPage } from '@web/server/topic/get-topic-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { getTranslations } from 'next-intl/server';

type TTopicPageProps = {
  slug: string;
  page?: number;
  locale: string;
  tenant: string;
};

/**
 * TopicPage — shared composition for `/topics/[slug]` (page 1, `page`
 * omitted) and `/topics/[slug]/page/[page]` (pages ≥ 2, `page` provided).
 * Fetches the `page_topic` shell once, then composes every other concern
 * as a self-fetching part reading the same cached `getTopicPage` loader.
 */
export const TopicPage = async ({
  slug,
  page,
  locale,
  tenant,
}: TTopicPageProps) => {
  const result = await getTopicPage(slug, tenant);
  const pageData = guardPageLoaderResult(result, 'topic_page.fetch_failed', {
    slug,
  });
  const { topic, hero, modules, postListId } = pageData;

  const topicPageT = await getTranslations('topicPage');

  return (
    <>
      <TopicBreadcrumbs slug={slug} tenant={tenant} />

      <BlogPageTemplate
        heading={topic.title}
        supportingText={topic.description}
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
        topicChips={<TopicChips activeSlug={slug} tenant={tenant} />}
        modules={
          <>
            <PostListModule
              id={postListId}
              locale={locale}
              tenant={tenant}
              page={page ?? 1}
              createHref={(pageNumber) => routes.topic(slug, pageNumber)}
              ariaLabel={topicPageT('paginationAriaLabel', {
                name: topic.title,
              })}
              accessibleTitle={topicPageT('title', { name: topic.title })}
              emptyMessageFallback={topicPageT('empty', { name: topic.title })}
              titleId="topic-posts-title"
            />
            <ModuleRenderer modules={modules} locale={locale} tenant={tenant} />
          </>
        }
      />
    </>
  );
};
