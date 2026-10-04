import type {
  InternationalizedArrayString,
  InternationalizedArrayText,
} from '@blog/config';
import type { TLocaleIsoCode } from '@blog/config/constants';
import type { TLocaleParams } from '@blog/service/shared/localization/locale-params/locale-params';
import type { GroqBuilder, GroqBuilderSubquery, QueryConfig } from 'groqd';

export type TLanguageFilter =
  'language == $locale' | 'language == $defaultLocale';

export type TLocaleQueryConfig = {
  schemaTypes: object;
  referenceSymbol: symbol;
  parameters: TLocaleParams;
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

export type TLocalizedValue<TScope, TKey extends keyof TScope> =
  NonNullable<TScope[TKey]> extends TPlainLocalizedArray
    ? NonNullable<NonNullable<TScope[TKey]>[number]['value']>
    : never;

export function getLocalizedField<
  TScope,
  TConfig extends QueryConfig,
  TKey extends TLocalizedKey<NonNullable<TScope>>,
>(
  sub: GroqBuilderSubquery<TScope, TConfig>,
  field: TKey,
): GroqBuilder<TLocalizedValue<NonNullable<TScope>, TKey> | null, TConfig>;
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
