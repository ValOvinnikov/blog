import { routes } from '@blog/config';
import { Heading } from '@blog/ui/atoms/heading';
import { Text } from '@blog/ui/atoms/text';
import {
  Breadcrumbs,
  type IBreadcrumbItem,
} from '@blog/ui/molecules/breadcrumbs';
import { BreadcrumbBar } from '@web/components/shared/breadcrumb-bar';
import { JsonLd } from '@web/components/shared/json-ld';
import { SmartLink } from '@web/components/shared/smart-link';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { env } from '@web/utils/env/env';
import { getTopicsSafely } from '@web/utils/get-topics-safely';
import { getTranslations } from 'next-intl/server';

import { topicsPageVariants } from './topics-page-variants';

const s = topicsPageVariants();

/**
 * TopicsPage — `/topics` composition: fetches every topic (with its
 * published-post count) via `getTopicsSafely` and renders each as a
 * card linking to its `/topics/[slug]` archive. This is a topic
 * *index*, not a post archive, so it uses its own lightweight shell rather
 * than forcing topic cards through `BlogPageTemplate`'s `posts` slot,
 * which is built specifically for post grids (blog index, topic, tag,
 * author archives). Renders a `Home › Topics` `Breadcrumbs` trail (plus its
 * `BreadcrumbList` JSON-LD) inside a `BreadcrumbBar` sibling before `<main>`.
 *
 * `getTopicsSafely` unwraps `getTopics`'s `AsyncResult`, falling
 * back to an empty list on failure — this is a topic index, not
 * critical page content, so a fetch failure here must never crash the
 * whole page (or, at build time, the whole static export).
 */
export const TopicsPage = async () => {
  const [topics, breadcrumbsT, t] = await Promise.all([
    getTopicsSafely(),
    getTranslations('breadcrumbs'),
    getTranslations('topicsPage'),
  ]);

  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? '';
  const trail: IBreadcrumbItem[] = [
    { label: breadcrumbsT('home'), href: routes.home() },
    { label: breadcrumbsT('topics'), href: routes.topics() },
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

      <main className={s.root()}>
        <Heading level={1} className={s.heading()}>
          {t('title')}
        </Heading>
        <Text className={s.intro()}>{t('intro')}</Text>
        {topics.length === 0 ? (
          <Text className={s.empty()}>{t('empty')}</Text>
        ) : (
          <ul className={s.list()}>
            {topics.map((topic) => (
              <li key={topic.id} className={s.card()}>
                <Heading level={2} visual="card">
                  <SmartLink
                    href={routes.topic(topic.slug)}
                    className={s.cardLink()}
                  >
                    {topic.title}
                  </SmartLink>
                </Heading>
                {topic.description ? (
                  <Text variant="card">{topic.description}</Text>
                ) : null}
                <Text variant="card">
                  {t('postsCount', { count: topic.postCount })}
                </Text>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
};
