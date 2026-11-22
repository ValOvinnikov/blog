export const toLocaleLimit = (additionalLanguages: number): number =>
  additionalLanguages + 1;

export const toAdditionalLanguages = (localeLimit: number): number =>
  localeLimit - 1;
