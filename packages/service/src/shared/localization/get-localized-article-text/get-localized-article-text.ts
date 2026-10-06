import type { InternationalizedArrayArticleText } from '@blog/config';
import { portableTextBodyItemFragment } from '@blog/service/shared/fragments/portable-text/portable-text-body-item';
import type {
  TLanguageFilter,
  TLocaleQueryConfig,
  TLocalizedKey,
} from '@blog/service/shared/localization/get-localized-field/get-localized-field';
import type {
  GroqBuilder,
  GroqBuilderSubquery,
  InferFragmentType,
  QueryConfig,
} from 'groqd';

type TArticleTextItem = InferFragmentType<typeof portableTextBodyItemFragment>;

export function getLocalizedArticleText<
  TScope,
  TConfig extends QueryConfig,
  TKey extends TLocalizedKey<
    NonNullable<TScope>,
    InternationalizedArrayArticleText
  >,
>(
  sub: GroqBuilderSubquery<TScope, TConfig>,
  field: TKey,
): GroqBuilder<TArticleTextItem[] | null, TConfig>;
export function getLocalizedArticleText(
  sub: GroqBuilderSubquery<
    Record<string, InternationalizedArrayArticleText>,
    TLocaleQueryConfig
  >,
  field: string,
): unknown {
  function items(filter: TLanguageFilter) {
    return sub
      .field(`${field}[]`)
      .filterBy(filter)
      .slice(0)
      .field('value[]')
      .project(portableTextBodyItemFragment)
      .nullable(true);
  }

  return sub.coalesce(
    items('language == $locale'),
    items('language == $defaultLocale'),
  );
}
