import { defineMigration } from 'sanity/migrate';

import {
  localizeHeadingBlock,
  type THeadingBlockValue,
} from '../lib/localize-heading-block';
import { localizeImage, type TImageValue } from '../lib/localize-image';
import { localizePortableTextField } from '../lib/localize-portable-text-field';
import { localizeStringField } from '../lib/localize-string-field';

type TCtaDoc = {
  headingBlock?: THeadingBlockValue;
  eyebrow?: unknown;
  footnote?: unknown;
  content?: unknown;
  image?: TImageValue;
};

export const localizeCtaModule = (doc: TCtaDoc) => {
  const patches = [
    ...localizeHeadingBlock(doc.headingBlock),
    ...localizeStringField('eyebrow', doc.eyebrow),
    ...localizePortableTextField('content', doc.content),
    ...localizeStringField('footnote', doc.footnote),
    ...localizeImage('image', doc.image),
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
