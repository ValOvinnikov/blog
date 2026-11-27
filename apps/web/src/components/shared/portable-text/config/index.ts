import {
  defaultComponents,
  mergeComponents,
  type PortableTextComponents,
  type PortableTextTypeComponent,
} from '@portabletext/react';
import { PORTABLE_TEXT_BLOCK_TYPE } from '@shinefold/config';

import { blockComponents } from './block';
import { makeExpandableSectionTypeComponent } from './expandable-section';
import { listComponents } from './list';
import { markComponents } from './marks';
import {
  bodyImageTypeComponent,
  codeTypeComponent,
  cookieListTypeComponent,
  makeAsideTypeComponent,
  makeTableTypeComponent,
} from './types';

const componentsWithoutAside: PortableTextComponents = {
  block: blockComponents,
  marks: markComponents,
  list: listComponents,
  types: {
    code: codeTypeComponent,
    bodyImage: bodyImageTypeComponent,
  },
};

const tableTypeComponent = makeTableTypeComponent(
  mergeComponents(defaultComponents, { marks: markComponents }),
);

const baseForAsideRecursion = mergeComponents(
  defaultComponents,
  componentsWithoutAside,
);

const makeArticleTextComponents = (
  aside: PortableTextTypeComponent,
): PortableTextComponents => ({
  ...componentsWithoutAside,
  types: {
    ...componentsWithoutAside.types,
    aside,
    [PORTABLE_TEXT_BLOCK_TYPE.COOKIE_LIST]: cookieListTypeComponent,
    [PORTABLE_TEXT_BLOCK_TYPE.TABLE]: tableTypeComponent,
  },
});

const makeExpandableSectionOverride = (
  aside: PortableTextTypeComponent,
  isSectionFullBleed: boolean,
) => ({
  [PORTABLE_TEXT_BLOCK_TYPE.EXPANDABLE_SECTION]:
    makeExpandableSectionTypeComponent(
      mergeComponents(defaultComponents, makeArticleTextComponents(aside)),
      isSectionFullBleed,
    ),
});

const aside = makeAsideTypeComponent(baseForAsideRecursion);
const articleTextComponents = makeArticleTextComponents(aside);

export const baseComponents = mergeComponents(defaultComponents, {
  ...articleTextComponents,
  types: {
    ...articleTextComponents.types,
    ...makeExpandableSectionOverride(aside, true),
  },
});

// A post's expandable section keeps the text measure; elsewhere it widens like a table.
export const postBodyOverride: PortableTextComponents = {
  types: makeExpandableSectionOverride(aside, false),
};
