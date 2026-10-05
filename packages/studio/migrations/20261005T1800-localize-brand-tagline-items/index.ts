import { at, defineMigration, set } from 'sanity/migrate';

import { localizedString } from '../lib/in-default-locale';

type TSiteSettingsDoc = {
  brand?: { tagline?: { items?: unknown[] } };
};

const toTaglineItem = (item: unknown, index: number) =>
  typeof item === 'string'
    ? {
        _key: `item-${String(index + 1)}`,
        _type: 'brandTaglineItem',
        text: localizedString(item),
      }
    : item;

export const localizeBrandTaglineItems = (doc: TSiteSettingsDoc) => {
  const items = doc.brand?.tagline?.items;

  return items?.some((item) => typeof item === 'string')
    ? [at(['brand', 'tagline', 'items'], set(items.map(toTaglineItem)))]
    : undefined;
};

export default defineMigration({
  title: 'Move brand tagline items into the default language',
  documentTypes: ['settings_site'],
  migrate: {
    document(doc) {
      return localizeBrandTaglineItems(doc as TSiteSettingsDoc);
    },
  },
});
