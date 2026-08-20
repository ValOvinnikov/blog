import { routes } from '@blog/config';
import { service } from '@blog/service';
import { Breadcrumbs, type IBreadcrumbItem } from '@blog/ui/molecules';
import { Pagination, PostsSection } from '@blog/ui/organisms';
import { BlogPageTemplate } from '@web/components/page-templates/blog-page-template';
import { BreadcrumbBar } from '@web/components/shared/breadcrumb-bar';
import { JsonLd } from '@web/components/shared/json-ld';
import { SmartLink } from '@web/components/shared/smart-link';
import { TopicChipList } from '@web/components/shared/topic-chip-list';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { env } from '@web/utils/env/env';
import { getTopicsSafely } from '@web/utils/get-topics-safely';
import { logger } from '@web/utils/logger/logger';
import { toPostListItems } from '@web/utils/to-post-list-items';
import { TOPIC_ITEMS_PER_PAGE } from '@web/utils/topic-items-per-page';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

type TTopicPageProps = { slug: string; page?: number };

/**
 * TopicPage — shared composition for `/topics/[slug]` (page 1, `page`
 * omitted) and `/topics/[slug]/page/[page]` (pages ≥ 2, `page` provided):
 * fetches posts for the topic, renders a `Home › Topic` `Breadcrumbs`
 * trail (plus its `BreadcrumbList` JSON-LD) inside a `BreadcrumbBar` sibling
 * before `<main>`, then renders the posts through the same pure ui
 * organisms as `BlogListPage`. `getTopicPage` always windows — page 1
 * gets the same pagination metadata as any other page.
 */
export async function TopicPage({ slug, page }: TTopicPageProps) {
  const [result, topics, t, breadcrumbsT, topicPageT] = await Promise.all([
    service.pages.topic.v1.getTopicPage(slug, {
      page,
      itemsPerPage: TOPIC_ITEMS_PER_PAGE,
    }),
    getTopicsSafely(),
    getTranslations('pagination'),
    getTranslations('breadcrumbs'),
    getTranslations('topicPage'),
  ]);

  if (!result.ok) {
    logger.error('topic_page.fetch_failed', { slug, error: result.error });
    notFound();
  }
  if (result.data === null) {
    notFound();
  }

  const { topic, posts, currentPage, totalPages } = result.data;

  // Out-of-range page (corpus shrank or hand-typed URL) → hard 404, never a
  // soft-404 or a redirect to the last page (spec SEO rules).
  if (page !== undefined && page > totalPages) {
    notFound();
  }

  const items = await toPostListItems(posts);

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
        posts={
          <PostsSection
            posts={items}
            title={topicPageT('title', { name: topic.title })}
            titleId="topic-posts-title"
            linkAs={SmartLink}
            emptyMessage={topicPageT('empty', { name: topic.title })}
          />
        }
        pagination={
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            createHref={(pageNumber) => routes.topic(slug, pageNumber)}
            ariaLabel={t('ariaLabel', { pageType: 'Topic' })}
            previousLabel={t('previous')}
            nextLabel={t('next')}
            linkAs={SmartLink}
          />
        }
      />
    </>
  );
}
