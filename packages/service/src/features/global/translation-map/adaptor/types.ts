import type { TLocaleIsoCode } from '@blog/config/constants';
import type { TPageTranslation } from '@blog/service/shared/localization/page-translations/to-page-translations';

export type TTranslationEntry = TPageTranslation & { documentType: string };

export type TTranslationGroup = TTranslationEntry[];

export type TTranslationMap = {
  groups: TTranslationGroup[];
  homeLanguages: TLocaleIsoCode[];
};
