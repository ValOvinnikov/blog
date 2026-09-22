import {
  defaultComponents,
  mergeComponents,
  type PortableTextComponents,
} from '@portabletext/react';

import { blockComponents } from './block';
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
