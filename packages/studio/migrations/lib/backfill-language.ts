import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { at, setIfMissing } from 'sanity/migrate';

export type TTranslatedDoc = { language?: string };

export const backfillLanguage = (doc: TTranslatedDoc) => {
  if (doc.language !== undefined) return undefined;

  return [at('language', setIfMissing(LOCALE_ISO_CODES.EN))];
};
