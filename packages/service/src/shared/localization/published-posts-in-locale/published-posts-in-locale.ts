import type { Page_post } from '@blog/config';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/expressions/post/published-post';
import type { TLocaleQueryConfig } from '@blog/service/shared/localization/get-localized-field/get-localized-field';
import type { TLocaleParams } from '@blog/service/shared/localization/locale-params/locale-params';
import type { GroqBuilder, InferResultItem, QueryConfig } from 'groqd';

export function publishedPostsInLocale<
  TResult,
  TConfig extends QueryConfig & { parameters: TLocaleParams },
>(
  documents: GroqBuilder<TResult, TConfig>,
): GroqBuilder<
  Extract<
    InferResultItem<GroqBuilder<TResult, TConfig>>,
    { _type: 'page_post' }
  >[],
  TConfig
>;
// Loose because groqd cannot type a filter field and parameter inside a generic config; the groq-js tests prove the result.
export function publishedPostsInLocale(
  documents: GroqBuilder<Page_post[], TLocaleQueryConfig>,
): unknown {
  return documents
    .filterByType('page_post')
    .filterBy('language == $locale')
    .filterRaw(PUBLISHED_POST_FILTER);
}
