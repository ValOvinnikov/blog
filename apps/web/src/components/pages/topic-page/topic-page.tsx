import { routes } from '@blog/config';
import { TopicBreadcrumbs } from '@web/components/features/topic/topic-breadcrumbs';
import { TopicChips } from '@web/components/features/topic/topic-chips';
import { PageShell } from '@web/components/page-templates/page-shell';
import { PageHeading } from '@web/components/shared/page-heading';
import { PageIntro } from '@web/components/shared/page-intro';
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
  const currentPage = page ?? 1;

  return (
    <PageShell>
      <PageShell.Breadcrumbs>
        <TopicBreadcrumbs slug={slug} tenant={tenant} />
      </PageShell.Breadcrumbs>
      <PageShell.Heading>
        <PageIntro hero={hero} locale={locale} tenant={tenant}>
          <PageHeading
            heading={topic.title}
            supportingText={topic.description}
          />
        </PageIntro>
      </PageShell.Heading>
      <PageShell.Content>
        <TopicChips activeSlug={slug} tenant={tenant} />
        <PostListModule
          id={postListId}
          locale={locale}
          tenant={tenant}
          page={currentPage}
          createHref={(pageNumber) => routes.topic(slug, pageNumber)}
          ariaLabel={topicPageT('paginationAriaLabel', { name: topic.title })}
          accessibleTitle={topicPageT('title', { name: topic.title })}
          emptyMessageFallback={topicPageT('empty', { name: topic.title })}
          titleId="topic-posts-title"
        />
        <ModuleRenderer
          modules={modules}
          context={{ page: currentPage }}
          locale={locale}
          tenant={tenant}
        />
      </PageShell.Content>
    </PageShell>
  );
};
