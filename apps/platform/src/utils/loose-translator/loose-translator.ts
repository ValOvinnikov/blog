/** Accepts both `useTranslations`'s and `getTranslations`'s return type without next-intl's per-namespace literal-key generic. */
export type TLooseTranslator = (
  key: string,
  values?: Record<string, string | number>,
) => string;
