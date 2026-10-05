import { defineMigration } from 'sanity/migrate';

import {
  localizeHeadingBlock,
  type THeadingBlockValue,
} from '../lib/localize-heading-block';
import { localizeImage, type TImageValue } from '../lib/localize-image';
import { localizePortableTextField } from '../lib/localize-portable-text-field';
import { localizeStringField } from '../lib/localize-string-field';

type THighlight = {
  _key: string;
  heading?: unknown;
  body?: unknown;
  image?: TImageValue;
};

type TFeatureHighlightsDoc = {
  headingBlock?: THeadingBlockValue;
  highlights?: THighlight[];
};

const localizeHighlight = (highlight: THighlight) => {
  const highlightPath = ['highlights', { _key: highlight._key }];

  return [
    ...localizeStringField([...highlightPath, 'heading'], highlight.heading),
    ...localizePortableTextField([...highlightPath, 'body'], highlight.body),
    ...localizeImage([...highlightPath, 'image'], highlight.image),
  ];
};

export const localizeFeatureHighlightsModule = (doc: TFeatureHighlightsDoc) => {
  const patches = [
    ...localizeHeadingBlock(doc.headingBlock),
    ...(doc.highlights ?? []).flatMap(localizeHighlight),
  ];

  return patches.length > 0 ? patches : undefined;
};

export default defineMigration({
  title: 'Move Feature Highlights module text into the default language',
  documentTypes: ['module_featureHighlights'],
  migrate: {
    document(doc) {
      return localizeFeatureHighlightsModule(doc as TFeatureHighlightsDoc);
    },
  },
});
