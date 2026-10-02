import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { at, defineMigration, set } from 'sanity/migrate';

type TLinkDoc = { label?: unknown; url?: unknown };

const LOCALIZED_FIELDS = ['label', 'url'] as const;

// Every tenant's default language is English when this runs.
const DEFAULT_LOCALE = LOCALE_ISO_CODES.EN;

const toLocalizedString = (value: string) => [
  {
    _key: DEFAULT_LOCALE,
    _type: 'internationalizedArrayStringValue',
    language: DEFAULT_LOCALE,
    value,
  },
];

export const localizeLinkDocument = (doc: TLinkDoc) => {
  const patches = LOCALIZED_FIELDS.flatMap((field) => {
    const value = doc[field];

    return typeof value === 'string'
      ? [at(field, set(toLocalizedString(value)))]
      : [];
  });

  return patches.length > 0 ? patches : undefined;
};

export default defineMigration({
  title: 'Move link labels and urls into the default language',
  documentTypes: ['link'],
  migrate: {
    document(doc) {
      return localizeLinkDocument(doc as TLinkDoc);
    },
  },
});
