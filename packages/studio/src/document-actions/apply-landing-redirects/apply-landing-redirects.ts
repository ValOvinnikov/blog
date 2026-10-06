import { LANDING_PAGE_MAX_DEPTH } from '@blog/config/constants';
import {
  planLandingRedirects,
  type TExistingRedirect,
  type TRedirectPlan,
} from '@blog/studio/document-actions/plan-landing-redirects/plan-landing-redirects';
import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { REDIRECT_TYPE } from '@blog/studio/schema-types/documents/redirect/redirect-type';
import { LANGUAGE_FIELD } from '@blog/studio/schema-types/fields/language-field/language-field';
import {
  flattenLandingParentChain,
  LANDING_PARENT_CHAIN_PROJECTION,
  type TLandingParentChainNode,
} from '@blog/studio/schema-types/queries/landing-parent-chain/landing-parent-chain';
import { getPublishedId, type SanityClient } from 'sanity';

type TDescendant = { slug?: string | null; children?: TDescendant[] | null };

type TLandingPlacement = {
  published: TLandingParentChainNode | null;
  parent: TLandingParentChainNode | null;
  descendants: TDescendant[] | null;
  redirects: TExistingRedirect[] | null;
};

type TLandingDraft = {
  _id: string;
  slug?: { current?: string | null } | null;
  parent?: { _ref?: string } | null;
  language?: unknown;
};

const nestDescendants = (levels: number): string =>
  levels === 0
    ? '{ "slug": slug.current }'
    : `{ "slug": slug.current, "children": *[_type == $type && parent._ref == ^._id]${nestDescendants(levels - 1)} }`;

const LANDING_PLACEMENT_QUERY = `{
  "published": *[_id == $id][0]${LANDING_PARENT_CHAIN_PROJECTION},
  "parent": *[_id == $parentId][0]${LANDING_PARENT_CHAIN_PROJECTION},
  "descendants": *[_type == $type && parent._ref == $id]${nestDescendants(LANDING_PAGE_MAX_DEPTH - 2)},
  "redirects": *[_type == $redirectType && ${LANGUAGE_FIELD} == $language]{ _id, source, destination }
}`;

const toPath = (
  slugs: readonly (string | null | undefined)[],
): string | null =>
  slugs.length > 0 && slugs.every(Boolean)
    ? `/${[...slugs].reverse().join('/')}`
    : null;

const descendantPaths = (
  base: string,
  nodes: TDescendant[] | null | undefined,
): string[] =>
  (nodes ?? []).flatMap(({ slug, children }) =>
    slug
      ? [`${base}/${slug}`, ...descendantPaths(`${base}/${slug}`, children)]
      : [],
  );

const planRedirects = async (
  client: Pick<SanityClient, 'fetch'>,
  draft: TLandingDraft,
  language: string,
): Promise<TRedirectPlan | null> => {
  const id = getPublishedId(draft._id);

  const placement = await client.fetch<TLandingPlacement>(
    LANDING_PLACEMENT_QUERY,
    {
      id,
      parentId: draft.parent?._ref ?? '',
      type: PAGE_LANDING_TYPE,
      redirectType: REDIRECT_TYPE,
      language,
    },
  );

  const from = toPath(
    flattenLandingParentChain(placement.published).map(({ slug }) => slug),
  );
  const parentSlugs = draft.parent?._ref
    ? flattenLandingParentChain(placement.parent).map(({ slug }) => slug)
    : [];
  const to = toPath([draft.slug?.current, ...parentSlugs]);

  if (!from || !to || (draft.parent?._ref && parentSlugs.length === 0)) {
    return null;
  }

  const livePaths = descendantPaths(to, placement.descendants);

  return planLandingRedirects(
    { from, to, isPrefix: livePaths.length > 0, livePaths },
    placement.redirects ?? [],
  );
};

export const applyLandingRedirects = async (
  client: Pick<SanityClient, 'fetch' | 'transaction'>,
  draft: TLandingDraft,
): Promise<void> => {
  const language =
    typeof draft[LANGUAGE_FIELD] === 'string' ? draft[LANGUAGE_FIELD] : '';
  const plan = await planRedirects(client, draft, language);

  if (!plan?.create) return;

  const transaction = client.transaction();

  plan.remove.forEach((id) => transaction.delete(id));
  plan.update.forEach(({ _id, destination }) =>
    transaction.patch(_id, (patch) => patch.set({ destination })),
  );
  transaction.create({
    _type: REDIRECT_TYPE,
    [LANGUAGE_FIELD]: language,
    ...plan.create,
  });

  await transaction.commit();
};
