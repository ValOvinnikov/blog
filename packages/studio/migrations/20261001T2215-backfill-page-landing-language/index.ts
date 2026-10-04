import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { at, defineMigration, setIfMissing } from 'sanity/migrate';

type TLandingPageDoc = { language?: string };

export const backfillPageLandingLanguage = (doc: TLandingPageDoc) => {
  if (doc.language !== undefined) return undefined;

  return [at('language', setIfMissing(LOCALE_ISO_CODES.EN))];
};

export default defineMigration({
  title: 'Backfill page_landing language to EN',
  documentTypes: ['page_landing'],
  migrate: {
    document(doc) {
      return backfillPageLandingLanguage(doc as TLandingPageDoc);
    },
  },
});
