import type { InternationalizedArrayListedText } from '@blog/config';
import { textBlockFragment } from '@blog/service/shared/fragments/portable-text/text-block';
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

type TTextBlock = InferFragmentType<typeof textBlockFragment>;

export function getLocalizedPortableTextBlock<
  TScope,
  TConfig extends QueryConfig,
  TKey extends TLocalizedKey<
    NonNullable<TScope>,
    InternationalizedArrayListedText
  >,
>(
  sub: GroqBuilderSubquery<TScope, TConfig>,
  field: TKey,
): GroqBuilder<TTextBlock[] | null, TConfig>;
export function getLocalizedPortableTextBlock(
  sub: GroqBuilderSubquery<
    Record<string, InternationalizedArrayListedText>,
    TLocaleQueryConfig
  >,
  field: string,
): unknown {
  function blocks(filter: TLanguageFilter) {
    return sub
      .field(`${field}[]`)
      .filterBy(filter)
      .slice(0)
      .field('value[]')
      .project(textBlockFragment)
      .nullable(true);
  }

  return sub.coalesce(
    blocks('language == $locale'),
    blocks('language == $defaultLocale'),
  );
}
