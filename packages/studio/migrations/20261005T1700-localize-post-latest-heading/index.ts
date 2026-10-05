import { defineMigration } from 'sanity/migrate';

import {
  localizeHeadingBlock,
  type THeadingBlockValue,
} from '../lib/localize-heading-block';

type TPostLatestModuleDoc = { headingBlock?: THeadingBlockValue };

export const localizePostLatestHeading = (doc: TPostLatestModuleDoc) => {
  const patches = localizeHeadingBlock(doc.headingBlock);

  return patches.length > 0 ? patches : undefined;
};

export default defineMigration({
  title: 'Move Latest Posts headings into the default language',
  documentTypes: ['module_postLatest'],
  migrate: {
    document(doc) {
      return localizePostLatestHeading(doc as TPostLatestModuleDoc);
    },
  },
});
