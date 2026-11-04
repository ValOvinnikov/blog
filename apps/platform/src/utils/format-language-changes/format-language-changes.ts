import { SUMMARY_JOINER } from '@platform/constants/summary';

export type TLanguageChangeCount = {
  language: string;
  count: number;
};

export const formatLanguageChanges = (
  changesByLanguage: TLanguageChangeCount[],
): string =>
  changesByLanguage
    .filter(({ count }) => count > 0)
    .map(({ language, count }) => `${language} ${count}`)
    .join(SUMMARY_JOINER);
