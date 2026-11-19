import { routes } from '@shinefold/config';
import { TaxonomyBreadcrumbs } from '@web/components/shared/taxonomy-breadcrumbs';
import { TOPIC_LOG } from '@web/constants/topic';
import { getTopicPage } from '@web/server/topic/get-topic-page/get-topic-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';

interface ITopicBreadcrumbsProps {
  slug: string;
  isAbovePageHeading?: boolean;
}

export const TopicBreadcrumbs = async ({
  slug,
  isAbovePageHeading,
}: ITopicBreadcrumbsProps) => {
  const result = await getTopicPage(slug);
  const { topic } = guardPageLoaderResult(
    result,
    TOPIC_LOG.BREADCRUMBS_FETCH_FAILED,
    { slug },
  );

  return (
    <TaxonomyBreadcrumbs
      term={{ label: topic.title, href: routes.topic(slug) }}
      isAbovePageHeading={isAbovePageHeading}
    />
  );
};
