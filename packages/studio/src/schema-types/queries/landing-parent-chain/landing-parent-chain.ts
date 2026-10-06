import { LANDING_PAGE_MAX_DEPTH } from '@blog/config/constants';
import { SECTION_NAVIGATION_FIELD } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { LANGUAGE_FIELD } from '@blog/studio/schema-types/fields/language-field/language-field';

export type TLandingParentChainNode = {
  _id: string;
  slug?: string | null;
  language?: string | null;
  sectionNavigation?: boolean | null;
  parent?: TLandingParentChainNode | null;
};

const NODE_FIELDS = `_id, "slug": slug.current, ${LANGUAGE_FIELD}, ${SECTION_NAVIGATION_FIELD}`;

const nestParents = (levels: number): string =>
  levels === 0
    ? `{ ${NODE_FIELDS} }`
    : `{ ${NODE_FIELDS}, "parent": parent->${nestParents(levels - 1)} }`;

export const LANDING_PARENT_CHAIN_PROJECTION = nestParents(
  LANDING_PAGE_MAX_DEPTH - 1,
);

export const LANDING_PARENT_CHAIN_QUERY = `*[_id == $parentId][0]${LANDING_PARENT_CHAIN_PROJECTION}`;

export const flattenLandingParentChain = (
  node: TLandingParentChainNode | null | undefined,
): TLandingParentChainNode[] =>
  node ? [node, ...flattenLandingParentChain(node.parent)] : [];
