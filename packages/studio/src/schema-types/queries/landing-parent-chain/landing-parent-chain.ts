import { LANDING_PAGE_MAX_DEPTH } from '@blog/config/constants';
import { LANGUAGE_FIELD } from '@blog/studio/schema-types/fields/language-field/language-field';

export const LANDING_PARENT_FIELD = 'parent';

export type TLandingParentChainNode = {
  _id: string;
  slug?: string | null;
  language?: string | null;
  parent?: TLandingParentChainNode | null;
};

const NODE_FIELDS = `_id, "slug": slug.current, ${LANGUAGE_FIELD}`;

const nestParents = (levels: number): string =>
  levels === 0
    ? `{ ${NODE_FIELDS} }`
    : `{ ${NODE_FIELDS}, "${LANDING_PARENT_FIELD}": ${LANDING_PARENT_FIELD}->${nestParents(levels - 1)} }`;

export const LANDING_PARENT_CHAIN_PROJECTION = nestParents(
  LANDING_PAGE_MAX_DEPTH - 1,
);

export const flattenLandingParentChain = (
  node: TLandingParentChainNode | null | undefined,
): TLandingParentChainNode[] =>
  node ? [node, ...flattenLandingParentChain(node.parent)] : [];
