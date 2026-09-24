import { at, defineMigration, set } from 'sanity/migrate';

type TSiteSettingsDoc = { currency?: string };

export const backfillSiteCurrency = (doc: TSiteSettingsDoc) => {
  if (doc.currency !== undefined) return undefined;

  return [at('currency', set('USD'))];
};

export default defineMigration({
  title: 'Backfill settings_site currency to USD',
  documentTypes: ['settings_site'],
  migrate: {
    document(doc) {
      return backfillSiteCurrency(doc as TSiteSettingsDoc);
    },
  },
});
