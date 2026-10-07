import type {
  InternationalizedArrayString,
  InternationalizedArrayText,
} from '@blog/config';
import type { TLocaleIsoCode } from '@blog/config/constants';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';
import type { GroqBuilder, GroqBuilderSubquery, QueryConfig } from 'groqd';

export type TLanguageFilter =
  'language == $locale' | 'language == $defaultLocale';

export type TLocaleQueryConfig = {
  schemaTypes: object;
  referenceSymbol: symbol;
  parameters: TLocaleQueryParams;
  scope: { $locale: TLocaleIsoCode; $defaultLocale: TLocaleIsoCode };
};

type TPlainLocalizedArray =
  InternationalizedArrayString | InternationalizedArrayText;

export type TLocalizedKey<
  TScope,
  TArray extends unknown[] = TPlainLocalizedArray,
> = {
  [TKey in keyof TScope & string]-?: NonNullable<TScope[TKey]> extends TArray
    ? TKey
    : never;
}[keyof TScope & string];

export function getLocalizedField<
  TScope,
  TConfig extends QueryConfig,
  TKey extends TLocalizedKey<NonNullable<TScope>>,
>(
  sub: GroqBuilderSubquery<TScope, TConfig>,
  field: TKey,
): GroqBuilder<string | null, TConfig>;
export function getLocalizedField(
  sub: GroqBuilderSubquery<
    Record<string, TPlainLocalizedArray>,
    TLocaleQueryConfig
  >,
  field: string,
): unknown {
  function entries(filter: TLanguageFilter) {
    return sub.field(`${field}[]`).filterBy(filter).slice(0);
  }

  return sub.coalesce(
    entries('language == $locale').field('value'),
    entries('language == $defaultLocale').field('value'),
  );
}
