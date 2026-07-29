import { routes } from '@blog/config';
import { Heading, Text } from '@blog/ui/atoms';
import { Breadcrumbs, type IBreadcrumbItem } from '@blog/ui/molecules';
import { BreadcrumbBar } from '@web/components/shared/breadcrumb-bar';
import { JsonLd } from '@web/components/shared/json-ld';
import { SmartLink } from '@web/components/shared/smart-link';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { env } from '@web/utils/env/env';
import { getCategoriesSafely } from '@web/utils/get-categories-safely';
import { getTranslations } from 'next-intl/server';

import { topicsPageVariants } from './topics-page-variants';

const s = topicsPageVariants();

/**
 * TopicsPage — `/topics` composition: fetches every category (with its
 * published-post count) via `getCategoriesSafely` and renders each as a
 * card linking to its `/category/[slug]` archive. This is a category
 * *index*, not a post archive, so it uses its own lightweight shell rather
 * than forcing category cards through `BlogPageTemplate`'s `posts` slot,
 * which is built specifically for post grids (blog index, category, tag,
 * author archives). Renders a `Home › Topics` `Breadcrumbs` trail (plus its
 * `BreadcrumbList` JSON-LD) inside a `BreadcrumbBar` sibling before `<main>`.
 *
 * `getCategoriesSafely` unwraps `getCategories`'s `AsyncResult`, falling
 * back to an empty list on failure — this is a category index, not
 * critical page content, so a fetch failure here must never crash the
 * whole page (or, at build time, the whole static export).
 */
export async function TopicsPage() {
  const [categories, breadcrumbsT] = await Promise.all([
    getCategoriesSafely(),
    getTranslations('breadcrumbs'),
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
          Topics
        </Heading>
        <Text className={s.intro()}>Browse every post by topic.</Text>
        {categories.length === 0 ? (
          <Text className={s.empty()}>No topics yet.</Text>
        ) : (
          <ul className={s.list()}>
            {categories.map((category) => (
              <li key={category.id} className={s.card()}>
                <Heading level={2} visual="card">
                  <SmartLink
                    href={routes.category(category.slug)}
                    className={s.cardLink()}
                  >
                    {category.title}
                  </SmartLink>
                </Heading>
                {category.description ? (
                  <Text variant="card">{category.description}</Text>
                ) : null}
                <Text variant="card">
                  {category.postCount === 1
                    ? '1 post'
                    : `${category.postCount} posts`}
                </Text>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
