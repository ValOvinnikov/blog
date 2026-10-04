import type { ListedText } from '@blog/config';
import { listedTextBlockFragment } from '@blog/service/shared/fragments/portable-text/listed-text-block';
import type { TLanguageFilter } from '@blog/service/shared/localization/get-localized-field/get-localized-field';
import type { GroqBuilder, GroqBuilderSubquery, QueryConfig } from 'groqd';

export function getLocalizedPortableTextField<
  TScope,
  TConfig extends QueryConfig,
>(
  sub: GroqBuilderSubquery<TScope, TConfig>,
  pick: (filter: TLanguageFilter) => GroqBuilder<ListedText | null, TConfig>,
) {
  return sub.coalesce(
    pick('language == $locale').project(listedTextBlockFragment).nullable(true),
    pick('language == $defaultLocale')
      .project(listedTextBlockFragment)
      .nullable(true),
  );
}
