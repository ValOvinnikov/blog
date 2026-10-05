import { at, defineMigration, set } from 'sanity/migrate';

import { inDefaultLocale } from '../lib/in-default-locale';
import {
  localizeHeadingBlock,
  type THeadingBlockValue,
} from '../lib/localize-heading-block';
import { localizeImage, type TImageValue } from '../lib/localize-image';
import { localizeStringField } from '../lib/localize-string-field';

type TCtaDoc = {
  headingBlock?: THeadingBlockValue;
  eyebrow?: unknown;
  footnote?: unknown;
  content?: unknown;
  image?: TImageValue;
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
