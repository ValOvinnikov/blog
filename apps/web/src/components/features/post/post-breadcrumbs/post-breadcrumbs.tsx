import { routes } from '@blog/config';
import {
  Breadcrumbs,
  type IBreadcrumbItem,
} from '@blog/ui/components/molecules/breadcrumbs';
import { BreadcrumbBar } from '@web/components/shared/breadcrumb-bar';
import { JsonLd } from '@web/components/shared/json-ld';
import { SmartLink } from '@web/components/shared/smart-link';
import { getPostPage } from '@web/server/post/get-post-page/get-post-page';
import { getRequestContext } from '@web/server/request-context/request-context';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { getTranslations } from 'next-intl/server';

export type TPostBreadcrumbsProps = {
  slug: string;
};

export const PostBreadcrumbs = async ({ slug }: TPostBreadcrumbsProps) => {
  const result = await getPostPage(slug);
  const post = guardPageLoaderResult(result, 'post_breadcrumbs.fetch_failed', {
    slug,
  });
  const { title, topic } = post;

  const [t, { metadataBase }] = await Promise.all([
    getTranslations('breadcrumbs'),
    getRequestContext(),
  ]);

  const breadcrumbTrail: IBreadcrumbItem[] = [
    { label: t('home'), href: routes.home() },
    { label: topic.title, href: routes.topic(topic.slug) },
    { label: title, href: routes.post(slug) },
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
