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
export function pinnedPostInLocale(
  scope: GroqBuilderSubquery<unknown, TPinnedPostConfig>,
  reference: GroqBuilder<Page_postReference | null, TPinnedPostConfig>,
  { publishedOnly = false }: { publishedOnly?: boolean } = {},
): unknown {
  return scope
    .coalesce(
      reference
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
            .deref()
            .project((post) => ({
              visible: post.select({
                [publishedOnly ? PUBLISHED_POST_FILTER : 'true']:
                  post.field('@'),
              }),
            }))
            .field('visible'),
        }))
        .field('translated'),
      reference
        .deref()
        .project((own) => ({
          visible: own.select({
            [publishedOnly
              ? `language == $locale && ${PUBLISHED_POST_FILTER}`
              : 'language == $locale']: own.field('@'),
          }),
        }))
        .field('visible'),
    )
    .project(postCardFragment);
}
