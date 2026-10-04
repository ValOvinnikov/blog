import type { ListedText } from '@blog/config';
import { listedTextBlockFragment } from '@blog/service/shared/fragments/portable-text/listed-text-block';
import type {
  TLanguageFilter,
  TLocaleQueryConfig,
  TLocalizedEntries,
  TLocalizedKey,
} from '@blog/service/shared/localization/get-localized-field/get-localized-field';
import type {
  GroqBuilder,
  GroqBuilderSubquery,
  InferFragmentType,
  QueryConfig,
} from 'groqd';

type TListedTextBlock = InferFragmentType<typeof listedTextBlockFragment>;

export function getLocalizedPortableTextBlock<
  TScope,
  TConfig extends QueryConfig,
  TKey extends TLocalizedKey<NonNullable<TScope>, ListedText>,
>(
  sub: GroqBuilderSubquery<TScope, TConfig>,
  field: TKey,
): GroqBuilder<TListedTextBlock[] | null, TConfig>;
export function getLocalizedPortableTextBlock(
  sub: GroqBuilderSubquery<
    Record<string, TLocalizedEntries<ListedText>>,
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
      .project(listedTextBlockFragment)
      .nullable(true);
  }

  return sub.coalesce(
    blocks('language == $locale'),
    blocks('language == $defaultLocale'),
  );
}
