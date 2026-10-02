import { routes } from '@blog/config';
import {
  Breadcrumbs,
  type IBreadcrumbItem,
} from '@blog/ui/components/molecules/breadcrumbs';
import { BreadcrumbBar } from '@web/components/shared/breadcrumb-bar';
import { JsonLd } from '@web/components/shared/json-ld';
import { SmartLink } from '@web/components/shared/smart-link';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getTopicPage } from '@web/server/topic/get-topic-page';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { getTranslations } from 'next-intl/server';

export type TTopicBreadcrumbsProps = {
  slug: string;
};

export const TopicBreadcrumbs = async ({ slug }: TTopicBreadcrumbsProps) => {
  const result = await getTopicPage(slug);
  const page = guardPageLoaderResult(result, 'topic_breadcrumbs.fetch_failed', {
    slug,
  });
  const { topic } = page;

  const [t, { metadataBase }] = await Promise.all([
    getTranslations('breadcrumbs'),
    getRequestContext(),
  ]);

  const breadcrumbTrail: IBreadcrumbItem[] = [
    { label: t('home'), href: routes.home() },
    { label: topic.title, href: routes.topic(slug) },
  ];
  const breadcrumbListSchema = buildBreadcrumbListSchema(
    breadcrumbTrail,
    metadataBase,
  );

  return (
    <>
      {breadcrumbListSchema && <JsonLd schema={breadcrumbListSchema} />}
      <BreadcrumbBar>
        <Breadcrumbs
          items={breadcrumbTrail}
          ariaLabel={t('ariaLabel')}
          linkAs={SmartLink}
        />
      </BreadcrumbBar>
    </>
  );
};
