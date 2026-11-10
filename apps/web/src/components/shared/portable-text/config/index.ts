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

const makeSectionTypeComponent = (aside: PortableTextTypeComponent) =>
  makeExpandableSectionTypeComponent(
    mergeComponents(defaultComponents, makeArticleTextComponents(aside)),
  );

const makeTypeOverrides = (aside: PortableTextTypeComponent) => ({
  aside,
  [PORTABLE_TEXT_BLOCK_TYPE.EXPANDABLE_SECTION]:
    makeSectionTypeComponent(aside),
});

const defaultAside = makeAsideTypeComponent(baseForAsideRecursion);
const articleTextComponents = makeArticleTextComponents(defaultAside);

export const baseComponents = mergeComponents(defaultComponents, {
  ...articleTextComponents,
  types: {
    ...articleTextComponents.types,
    ...makeTypeOverrides(defaultAside),
  },
});

export const createAsideOverride = (
  asideKindLabels?: TAsideKindLabels,
): PortableTextComponents => ({
  types: makeTypeOverrides(
    makeAsideTypeComponent(baseForAsideRecursion, asideKindLabels),
  ),
});

export type { TAsideKindLabels } from './types';
