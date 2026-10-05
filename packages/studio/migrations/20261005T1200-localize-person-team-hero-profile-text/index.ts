import { defineMigration } from 'sanity/migrate';

import {
  localizeHeadingBlock,
  type THeadingBlockValue,
} from '../lib/localize-heading-block';
import { localizeImage, type TImageValue } from '../lib/localize-image';
import { localizePortableTextField } from '../lib/localize-portable-text-field';
import { localizeStringField } from '../lib/localize-string-field';

type TPersonDoc = {
  _type: 'person';
  role?: unknown;
  bio?: unknown;
  image?: TImageValue;
};

type TTeamDoc = {
  _type: 'module_team';
  headingBlock?: THeadingBlockValue;
};

type THeroProfileDoc = {
  _type: 'module_heroProfile';
  headingBlock?: THeadingBlockValue;
  image?: TImageValue;
};

type TLocalizableDoc = TPersonDoc | TTeamDoc | THeroProfileDoc;

const patchesFor = (doc: TLocalizableDoc) => {
  switch (doc._type) {
    case 'person':
      return [
        ...localizeStringField('role', doc.role),
        ...localizePortableTextField(
          'bio',
          doc.bio,
          'internationalizedArrayParagraphTextValue',
        ),
        ...localizeImage('image', doc.image),
      ];
    case 'module_team':
      return localizeHeadingBlock(doc.headingBlock);
    case 'module_heroProfile':
      return [
        ...localizeHeadingBlock(doc.headingBlock),
        ...localizeImage('image', doc.image),
      ];
  }
};

export const localizePersonTeamHeroProfile = (doc: TLocalizableDoc) => {
  const patches = patchesFor(doc);

  return patches.length > 0 ? patches : undefined;
};

export default defineMigration({
  title: 'Move person, Team and Profile Hero text into the default language',
  documentTypes: ['person', 'module_team', 'module_heroProfile'],
  migrate: {
    document(doc) {
      return localizePersonTeamHeroProfile(doc as TLocalizableDoc);
    },
  },
});
