import { routes } from '@blog/config';
import { Heading, Text } from '@blog/ui/atoms';
import { Link } from '@web/i18n/navigation';
import { getCategoriesSafely } from '@web/utils/get-categories-safely';

import { topicsPageVariants } from './topics-page-variants';

const s = topicsPageVariants();

/**
 * TopicsPage — `/topics` composition: fetches every category (with its
 * published-post count) via `getCategoriesSafely` and renders each as a
 * card linking to its `/category/[slug]` archive. This is a category
 * *index*, not a post archive, so it uses its own lightweight shell rather
 * than forcing category cards through `BlogPageTemplate`'s `posts` slot,
 * which is built specifically for post grids (blog index, category, tag,
 * author archives).
 *
 * `getCategories` is not `AsyncResult`-wrapped, so an uncaught failure
 * would otherwise propagate straight through a Server Component render and
 * crash the whole page (or, at build time, the whole static export) —
 * hence the `getCategoriesSafely` wrapper, which falls back to an empty
 * list.
 */
export async function TopicsPage() {
  const categories = await getCategoriesSafely();

  return (
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
                <Link
                  href={routes.category(category.slug)}
                  className={s.cardLink()}
                >
                  {category.title}
                </Link>
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
  );
}
