import { defineMigration } from 'sanity/migrate';

import {
  localizeHeadingBlock,
  type THeadingBlockValue,
} from '../lib/localize-heading-block';
import { localizeImage, type TImageValue } from '../lib/localize-image';
import { localizePortableTextField } from '../lib/localize-portable-text-field';
import { localizeStringField } from '../lib/localize-string-field';

type TTestimonialBlockDoc = {
  _type: 'block_testimonial';
  quote?: unknown;
  role?: unknown;
  image?: TImageValue;
};

type TTestimonialModuleDoc = {
  _type: 'module_testimonial';
  headingBlock?: THeadingBlockValue;
};

type TLocalizableDoc = TTestimonialBlockDoc | TTestimonialModuleDoc;

export const localizeTestimonialDocument = (doc: TLocalizableDoc) => {
  const patches =
    doc._type === 'block_testimonial'
      ? [
          ...localizePortableTextField('quote', doc.quote),
          ...localizeStringField('role', doc.role),
          ...localizeImage('image', doc.image),
        ]
      : localizeHeadingBlock(doc.headingBlock);

  return patches.length > 0 ? patches : undefined;
};

export default defineMigration({
  title:
    'Move testimonial quotes, roles, photo alts and module headings into the default language',
  documentTypes: ['block_testimonial', 'module_testimonial'],
  migrate: {
    document(doc) {
      return localizeTestimonialDocument(doc as TLocalizableDoc);
    },
  },
});
