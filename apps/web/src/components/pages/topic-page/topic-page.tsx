import { TAXONOMY_KIND } from '@shinefold/config';
import { TopicBreadcrumbs } from '@web/components/features/topic/topic-breadcrumbs';
import { TopicChips } from '@web/components/features/topic/topic-chips';
import { TaxonomyPage } from '@web/components/pages/taxonomy-page';
import { TOPIC_LOG } from '@web/constants/topic';
import { getTopicPage } from '@web/server/topic/get-topic-page/get-topic-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';

interface ITopicPageProps {
  slug: string;
  page?: number;
}

export const TopicPage = async ({ slug, page }: ITopicPageProps) => {
  const result = await getTopicPage(slug);
  const pageData = guardPageLoaderResult(result, TOPIC_LOG.PAGE_FETCH_FAILED, {
    slug,
  });
  const { topic, hero } = pageData;

  return (
    <TaxonomyPage
      kind={TAXONOMY_KIND.TOPICS}
      slug={slug}
      page={page}
      term={topic}
      pageData={pageData}
      breadcrumbs={<TopicBreadcrumbs slug={slug} isAbovePageHeading={!hero} />}
    >
      <TopicChips activeSlug={slug} />
    </TaxonomyPage>
  );
};
