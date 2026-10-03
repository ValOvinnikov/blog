import type { GroqBuilderSubquery, IGroqBuilder, QueryConfig } from 'groqd';

export function buildLocalizedValueExpression(field: string): string {
  return `coalesce(${field}[language == $locale][0].value, ${field}[language == $defaultLocale][0].value)`;
}

export function localizedField<TResult, TQueryConfig extends QueryConfig>(
  sub: GroqBuilderSubquery<TResult, TQueryConfig>,
  field: string,
) {
  return sub.raw<string | null>(buildLocalizedValueExpression(field));
}

export const LOCALE_CONDITION = {
  REQUESTED: 'language == $locale',
  DEFAULT: 'language == $defaultLocale',
} as const;

export function localizedProjectedField<
  TResult,
  TQueryConfig extends QueryConfig,
  TValue extends IGroqBuilder,
>(
  sub: GroqBuilderSubquery<TResult, TQueryConfig>,
  resolve: (
    condition: (typeof LOCALE_CONDITION)[keyof typeof LOCALE_CONDITION],
  ) => TValue,
) {
  return sub.coalesce(
    resolve(LOCALE_CONDITION.REQUESTED),
    resolve(LOCALE_CONDITION.DEFAULT),
  );
}
