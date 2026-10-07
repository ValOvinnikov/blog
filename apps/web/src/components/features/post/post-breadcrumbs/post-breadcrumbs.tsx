import { routes } from '@blog/config';
import {
  Breadcrumbs,
  type IBreadcrumbItem,
} from '@blog/ui/components/molecules/breadcrumbs';
import { BreadcrumbBar } from '@web/components/shared/breadcrumb-bar';
import { JsonLd } from '@web/components/shared/json-ld';
import { SmartLink } from '@web/components/shared/smart-link';
import { getPostPage } from '@web/server/post/get-post-page/get-post-page';
import { getHomeBreadcrumb } from '@web/server/site-settings/get-home-breadcrumb/get-home-breadcrumb';
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

  const [homeBreadcrumb, t] = await Promise.all([
    getHomeBreadcrumb(),
    getTranslations('breadcrumbs'),
  ]);

  const breadcrumbTrail: IBreadcrumbItem[] = [
    homeBreadcrumb,
    ...(topic.slug
      ? [{ label: topic.title, href: routes.topic(topic.slug) }]
      : []),
    { label: title, href: routes.post(slug) },
  ];
  const breadcrumbListSchema = await buildBreadcrumbListSchema(breadcrumbTrail);

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
