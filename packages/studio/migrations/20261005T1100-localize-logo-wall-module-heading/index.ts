import { defineMigration } from 'sanity/migrate';

import {
  localizeHeadingBlock,
  type THeadingBlockValue,
} from '../lib/localize-heading-block';

type TLogoWallDoc = { headingBlock?: THeadingBlockValue };

export const localizeLogoWallModule = (doc: TLogoWallDoc) => {
  const patches = localizeHeadingBlock(doc.headingBlock);

  return patches.length > 0 ? patches : undefined;
};

export default defineMigration({
  title: 'Move Logo Wall module heading into the default language',
  documentTypes: ['module_logoWall'],
  migrate: {
    document(doc) {
      return localizeLogoWallModule(doc as TLogoWallDoc);
    },
  },
});
