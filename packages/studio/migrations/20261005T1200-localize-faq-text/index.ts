import { defineMigration } from 'sanity/migrate';

import {
  localizeHeadingBlock,
  type THeadingBlockValue,
} from '../lib/localize-heading-block';
import { localizePortableTextField } from '../lib/localize-portable-text-field';
import { localizeStringField } from '../lib/localize-string-field';

type TFaqBlockDoc = {
  _type: 'block_faq';
  question?: unknown;
  answer?: unknown;
};

type TFaqModuleDoc = {
  _type: 'module_faq';
  headingBlock?: THeadingBlockValue;
};

export const localizeFaqDocument = (doc: TFaqBlockDoc | TFaqModuleDoc) => {
  const patches =
    doc._type === 'block_faq'
      ? [
          ...localizeStringField('question', doc.question),
          ...localizePortableTextField('answer', doc.answer),
        ]
      : localizeHeadingBlock(doc.headingBlock);

  return patches.length > 0 ? patches : undefined;
};

export default defineMigration({
  title:
    'Move FAQ questions, answers and module headings into the default language',
  documentTypes: ['block_faq', 'module_faq'],
  migrate: {
    document(doc) {
      return localizeFaqDocument(doc as TFaqBlockDoc | TFaqModuleDoc);
    },
  },
});
