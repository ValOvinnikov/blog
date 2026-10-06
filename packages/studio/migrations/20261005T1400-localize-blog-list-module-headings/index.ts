import { defineMigration } from 'sanity/migrate';

import {
  localizeHeadingBlock,
  type THeadingBlockValue,
} from '../lib/localize-heading-block';

type TBlogListModuleDoc = { headingBlock?: THeadingBlockValue };

export const localizeBlogListModuleHeading = (doc: TBlogListModuleDoc) => {
  const patches = localizeHeadingBlock(doc.headingBlock);

  return patches.length > 0 ? patches : undefined;
};

export default defineMigration({
  title:
    'Move Post List, Related Reading, Featured Posts and Taxonomy List headings into the default language',
  documentTypes: [
    'module_postList',
    'module_postRelated',
    'module_postFeatured',
    'module_taxonomyList',
  ],
  migrate: {
    document(doc) {
      return localizeBlogListModuleHeading(doc as TBlogListModuleDoc);
    },
  },
});
