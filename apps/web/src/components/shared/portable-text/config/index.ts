import { PORTABLE_TEXT_BLOCK_TYPE } from '@blog/config';
import {
  defaultComponents,
  mergeComponents,
  type PortableTextComponents,
  type PortableTextTypeComponent,
} from '@portabletext/react';

import { blockComponents } from './block';
import { CookieList } from './cookie-list';
import { makeExpandableSectionTypeComponent } from './expandable-section';
import { listComponents } from './list';
import { markComponents } from './marks';
import {
  bodyImageTypeComponent,
  codeTypeComponent,
  makeAsideTypeComponent,
  makeTableTypeComponent,
  type TAsideKindLabels,
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
    [PORTABLE_TEXT_BLOCK_TYPE.COOKIE_LIST]: CookieList,
    [PORTABLE_TEXT_BLOCK_TYPE.TABLE]: tableTypeComponent,
  },
});

const makeTypeOverrides = (
  aside: PortableTextTypeComponent,
  isSectionFullBleed: boolean,
) => ({
  aside,
  [PORTABLE_TEXT_BLOCK_TYPE.EXPANDABLE_SECTION]:
    makeExpandableSectionTypeComponent(
      mergeComponents(defaultComponents, makeArticleTextComponents(aside)),
      isSectionFullBleed,
    ),
});

const defaultAside = makeAsideTypeComponent(baseForAsideRecursion);
const articleTextComponents = makeArticleTextComponents(defaultAside);

export const baseComponents = mergeComponents(defaultComponents, {
  ...articleTextComponents,
  types: {
    ...articleTextComponents.types,
    ...makeTypeOverrides(defaultAside, true),
  },
});

// A post's expandable section keeps the text measure; elsewhere it widens like a table.
export const createPostBodyOverride = (
  asideKindLabels?: TAsideKindLabels,
): PortableTextComponents => ({
  types: makeTypeOverrides(
    makeAsideTypeComponent(baseForAsideRecursion, asideKindLabels),
    false,
  ),
});

export type { TAsideKindLabels } from './types';
