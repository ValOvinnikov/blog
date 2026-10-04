import type { TLanguageFilter } from '@blog/service/shared/localization/localized-value/localized-value';
import type { GroqBuilderSubquery, IGroqBuilder, QueryConfig } from 'groqd';

export function translatedReference<
  TScope,
  TConfig extends QueryConfig,
  TTranslated extends IGroqBuilder,
  TOwn extends IGroqBuilder,
>(
  page: GroqBuilderSubquery<TScope, TConfig>,
  pickTranslated: (filter: TLanguageFilter) => TTranslated,
  own: TOwn,
) {
  return page.coalesce(
    pickTranslated('language == $locale'),
    pickTranslated('language == $defaultLocale'),
    own,
  );
}
