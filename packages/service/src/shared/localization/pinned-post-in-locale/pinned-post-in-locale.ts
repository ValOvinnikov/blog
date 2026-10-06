import type { Page_postReference } from '@blog/config';
import type { TSchemaConfig } from '@blog/service/sanity/query/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/expressions/post/published-post';
import { postCardFragment } from '@blog/service/shared/fragments/post/post';
import type { TLocaleQueryConfig } from '@blog/service/shared/localization/get-localized-field/get-localized-field';
import type {
  GroqBuilder,
  GroqBuilderSubquery,
  InferFragmentType,
  QueryConfig,
} from 'groqd';

type TPostCard = InferFragmentType<typeof postCardFragment>;

type TPinnedPostConfig = TLocaleQueryConfig & TSchemaConfig;

export function pinnedPostInLocale<
  TScope,
  TConfig extends QueryConfig,
  TReference extends Page_postReference | null,
>(
  scope: GroqBuilderSubquery<TScope, TConfig>,
  reference: GroqBuilder<TReference, TConfig>,
  options?: { publishedOnly?: boolean },
): GroqBuilder<TPostCard | null, TConfig>;
// Loose because groqd cannot type the generic reference/deref chain; the groq-js tests prove the result.
export function pinnedPostInLocale(
  scope: GroqBuilderSubquery<unknown, TPinnedPostConfig>,
  reference: GroqBuilder<Page_postReference | null, TPinnedPostConfig>,
  { publishedOnly = false }: { publishedOnly?: boolean } = {},
): unknown {
  const translated = reference
    .deref()
    .project((group) => ({
      translated: group.star
        .filterByType('translation.metadata')
        .filterBy('references(^._id)')
        .slice(0)
        .field('translations[]')
        .filterBy('language == $locale')
        .slice(0)
        .field('value')
        .deref(),
    }))
    .field('translated');

  // groqd's select takes raw GROQ conditions, so the published check cannot use filterBy.
  const ownKey = publishedOnly
    ? `language == $locale && ${PUBLISHED_POST_FILTER}`
    : 'language == $locale';

  return scope
    .coalesce(
      publishedOnly
        ? translated
            .project((post) => ({
              // groqd throws at runtime on .field() after a .project() whose fields use .notNull(), so the card is projected once at the end.
              visible: post.select({
                [PUBLISHED_POST_FILTER]: post.field('@'),
              }),
            }))
            .field('visible')
        : translated,
      reference
        .deref()
        .project((own) => ({
          visible: own.select({ [ownKey]: own.field('@') }),
        }))
        .field('visible'),
    )
    .project(postCardFragment);
}
