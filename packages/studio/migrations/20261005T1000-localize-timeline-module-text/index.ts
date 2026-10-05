import { defineMigration } from 'sanity/migrate';

import {
  localizeHeadingBlock,
  type THeadingBlockValue,
} from '../lib/localize-heading-block';
import { localizePortableTextField } from '../lib/localize-portable-text-field';
import { localizeStringField } from '../lib/localize-string-field';

type TTimelineItem = {
  _key: string;
  marker?: unknown;
  heading?: unknown;
  body?: unknown;
};

type TTimelineDoc = {
  headingBlock?: THeadingBlockValue;
  items?: TTimelineItem[];
};

const localizeItem = (item: TTimelineItem) => {
  const itemPath = ['items', { _key: item._key }];

  return [
    ...localizeStringField([...itemPath, 'marker'], item.marker),
    ...localizeStringField([...itemPath, 'heading'], item.heading),
    ...localizePortableTextField(
      [...itemPath, 'body'],
      item.body,
      'internationalizedArrayParagraphTextValue',
    ),
  ];
};

export const localizeTimelineModule = (doc: TTimelineDoc) => {
  const patches = [
    ...localizeHeadingBlock(doc.headingBlock),
    ...(doc.items ?? []).flatMap(localizeItem),
  ];

  return patches.length > 0 ? patches : undefined;
};

export default defineMigration({
  title: 'Move Timeline module text into the default language',
  documentTypes: ['module_timeline'],
  migrate: {
    document(doc) {
      return localizeTimelineModule(doc as TTimelineDoc);
    },
  },
});
