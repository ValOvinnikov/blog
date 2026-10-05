import { defineMigration } from 'sanity/migrate';

import {
  localizeHeadingBlock,
  type THeadingBlockValue,
} from '../lib/localize-heading-block';
import { localizeStringField } from '../lib/localize-string-field';

type TStat = {
  _key: string;
  value?: unknown;
  label?: unknown;
  description?: unknown;
};

type TStatsDoc = {
  headingBlock?: THeadingBlockValue;
  stats?: TStat[];
  footnote?: unknown;
};

const localizeStat = (stat: TStat) => {
  const statPath = ['stats', { _key: stat._key }];

  return [
    ...localizeStringField([...statPath, 'value'], stat.value),
    ...localizeStringField([...statPath, 'label'], stat.label),
    ...localizeStringField([...statPath, 'description'], stat.description),
  ];
};

export const localizeStatsModule = (doc: TStatsDoc) => {
  const patches = [
    ...localizeHeadingBlock(doc.headingBlock),
    ...(doc.stats ?? []).flatMap(localizeStat),
    ...localizeStringField('footnote', doc.footnote),
  ];

  return patches.length > 0 ? patches : undefined;
};

export default defineMigration({
  title: 'Move Stats module text into the default language',
  documentTypes: ['module_stats'],
  migrate: {
    document(doc) {
      return localizeStatsModule(doc as TStatsDoc);
    },
  },
});
