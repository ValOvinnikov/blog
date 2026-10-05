import { defineMigration } from 'sanity/migrate';

import {
  localizeHeadingBlock,
  type THeadingBlockValue,
} from '../lib/localize-heading-block';

type TNewsletterDoc = { headingBlock?: THeadingBlockValue };

export const localizeNewsletterModule = (doc: TNewsletterDoc) => {
  const patches = localizeHeadingBlock(doc.headingBlock);

  return patches.length > 0 ? patches : undefined;
};

export default defineMigration({
  title: 'Move Newsletter module heading into the default language',
  documentTypes: ['module_newsletter'],
  migrate: {
    document(doc) {
      return localizeNewsletterModule(doc as TNewsletterDoc);
    },
  },
});
