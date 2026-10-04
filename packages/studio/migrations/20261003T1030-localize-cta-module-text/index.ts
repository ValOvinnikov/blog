import { at, defineMigration, set } from 'sanity/migrate';

import {
  inDefaultLocale,
  localizeHeadingBlock,
  localizeImage,
  localizeStringField,
  type TSanityObject,
} from '../lib/localize-into-default-locale';

type TCtaDoc = {
  headingBlock?: TSanityObject;
  eyebrow?: unknown;
  footnote?: unknown;
  content?: unknown;
  image?: TSanityObject;
};

const isPortableText = (value: unknown): value is unknown[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every(
    (item) => (item as { _type?: unknown } | null)?._type === 'block',
  );

const localizeContent = (content: unknown) =>
  isPortableText(content)
    ? [
        at(
          'content',
          set(
            inDefaultLocale('internationalizedArrayListedTextValue', content),
          ),
        ),
      ]
    : [];

export const localizeCtaModule = (doc: TCtaDoc) => {
  const patches = [
    ...localizeHeadingBlock(doc.headingBlock),
    ...localizeStringField('eyebrow', doc.eyebrow),
    ...localizeContent(doc.content),
    ...localizeStringField('footnote', doc.footnote),
    ...localizeImage(doc.image),
  ];

  return patches.length > 0 ? patches : undefined;
};

export default defineMigration({
  title: 'Move CTA module text into the default language',
  documentTypes: ['module_cta'],
  migrate: {
    document(doc) {
      return localizeCtaModule(doc as TCtaDoc);
    },
  },
});
