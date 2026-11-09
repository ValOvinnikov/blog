import { PORTABLE_TEXT_BLOCK_TYPE } from '@blog/config';
import {
  defaultComponents,
  mergeComponents,
  type PortableTextComponents,
} from '@portabletext/react';

import { blockComponents } from './block';
import { CookieList } from './cookie-list';
import { listComponents } from './list';
import { markComponents } from './marks';
import {
  bodyImageTypeComponent,
  codeTypeComponent,
  makeAsideTypeComponent,
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

const baseForAsideRecursion = mergeComponents(
  defaultComponents,
  componentsWithoutAside,
);

const portableTextComponents: PortableTextComponents = {
  block: blockComponents,
  marks: markComponents,
  list: listComponents,
  types: {
    code: codeTypeComponent,
    bodyImage: bodyImageTypeComponent,
    aside: makeAsideTypeComponent(baseForAsideRecursion),
    [PORTABLE_TEXT_BLOCK_TYPE.COOKIE_LIST]: CookieList,
  },
};

export const baseComponents = mergeComponents(
  defaultComponents,
  portableTextComponents,
);

export const createAsideOverride = (
  asideKindLabels?: TAsideKindLabels,
): PortableTextComponents => ({
  types: {
    aside: makeAsideTypeComponent(baseForAsideRecursion, asideKindLabels),
  },
});

export type { TAsideKindLabels } from './types';
