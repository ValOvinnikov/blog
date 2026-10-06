import { LANDING_PAGE_MAX_DEPTH } from '@blog/config/constants';
import { LANGUAGE_FIELD } from '@blog/studio/schema-types/fields/language-field/language-field';
import {
  flattenLandingParentChain,
  LANDING_PARENT_CHAIN_PROJECTION,
  LANDING_PARENT_FIELD,
  type TLandingParentChainNode,
} from '@blog/studio/schema-types/queries/landing-parent-chain/landing-parent-chain';
import { fetchDraftsFailSafe } from '@blog/studio/schema-types/validation/get-drafts-client/get-drafts-client';
import { getPublishedId, type Reference, type ValidationContext } from 'sanity';

type TDescendant = { _id: string; children?: TDescendant[] | null };

type TParentPlacement = {
  ancestors: TLandingParentChainNode | null;
  descendants: TDescendant[] | null;
};

export const LANDING_PARENT_CYCLE_ERROR =
  "A page can't sit beneath itself or one of its own sub-pages — choose a different parent.";

export const LANDING_PARENT_LANGUAGE_ERROR =
  'The parent page must be in the same language as this page.';

export const LANDING_PARENT_DEPTH_ERROR = `Pages nest at most ${LANDING_PAGE_MAX_DEPTH} levels deep, counting this page and any pages beneath it — choose a parent higher up.`;

const nestChildren = (levels: number): string =>
  levels === 0
    ? '{ _id }'
    : `{ _id, "children": *[_type == $type && ${LANDING_PARENT_FIELD}._ref == ^._id]${nestChildren(levels - 1)} }`;

const PARENT_PLACEMENT_QUERY = `{
  "ancestors": *[_id == $parentId][0]${LANDING_PARENT_CHAIN_PROJECTION},
  "descendants": *[_type == $type && ${LANDING_PARENT_FIELD}._ref == $id]${nestChildren(LANDING_PAGE_MAX_DEPTH - 2)}
}`;

const subtreeHeight = (nodes: TDescendant[] | null | undefined): number =>
  nodes && nodes.length > 0
    ? 1 + Math.max(...nodes.map(({ children }) => subtreeHeight(children)))
    : 0;

const languageOf = (value: unknown): string =>
  typeof value === 'string' ? value : '';

export const validateLandingParent = async (
  value: Reference | undefined,
  context: ValidationContext,
): Promise<string | true> => {
  const parentId = value?._ref;
  const { document } = context;

  if (!parentId || !document) return true;

  const id = getPublishedId(document._id);

  if (getPublishedId(parentId) === id) return LANDING_PARENT_CYCLE_ERROR;

  const placement = await fetchDraftsFailSafe<TParentPlacement | null>(
    context,
    PARENT_PLACEMENT_QUERY,
    { parentId, id, type: document._type },
    null,
  );

  const ancestors = flattenLandingParentChain(placement?.ancestors);
  const [parent] = ancestors;

  if (!parent) return true;

  if (ancestors.some(({ _id }) => _id === id)) {
    return LANDING_PARENT_CYCLE_ERROR;
  }

  if (languageOf(parent.language) !== languageOf(document[LANGUAGE_FIELD])) {
    return LANDING_PARENT_LANGUAGE_ERROR;
  }

  const depth = ancestors.length + 1 + subtreeHeight(placement?.descendants);

  return depth > LANDING_PAGE_MAX_DEPTH ? LANDING_PARENT_DEPTH_ERROR : true;
};
