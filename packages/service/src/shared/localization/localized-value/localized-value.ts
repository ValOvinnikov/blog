import type { GroqBuilderSubquery, IGroqBuilder, QueryConfig } from 'groqd';

export type TLanguageFilter =
  'language == $locale' | 'language == $defaultLocale';

export function localizedValue<
  TScope,
  TConfig extends QueryConfig,
  TValue extends IGroqBuilder,
>(
  sub: GroqBuilderSubquery<TScope, TConfig>,
  pick: (filter: TLanguageFilter) => TValue,
) {
  return sub.coalesce(
    pick('language == $locale'),
    pick('language == $defaultLocale'),
  );
}
