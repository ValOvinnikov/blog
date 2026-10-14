import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import { PAGE_TAG_TYPE } from '@blog/studio/schema-types/documents/pages/tag/tag-type';
import { PAGE_TOPIC_TYPE } from '@blog/studio/schema-types/documents/pages/topic/topic-type';
import { LANGUAGE_FIELD } from '@blog/studio/schema-types/fields/language-field/language-field';
import {
  flattenLandingParentChain,
  LANDING_PARENT_CHAIN_PROJECTION,
  type TLandingParentChainNode,
} from '@blog/studio/schema-types/queries/landing-parent-chain/landing-parent-chain';
import type { SanityClient } from 'sanity';

export type TPublishedPage = { title?: string | null };

type TLandingCandidate = TPublishedPage & {
  parent?: TLandingParentChainNode | null;
};

const FIXED_ROUTE =
  /^\/(?:blog(?:\/page\/\d+)?|topics|tags|account|bookmarks)?$/;

const SLUG_ROUTE: Record<string, string> = {
  blog: PAGE_POST_TYPE,
  topics: PAGE_TOPIC_TYPE,
  tags: PAGE_TAG_TYPE,
};

const PAGINATED_SLUG_ROUTES = new Set([PAGE_TOPIC_TYPE, PAGE_TAG_TYPE]);

const SLUG_PAGE_QUERY = `*[_type == $type && ${LANGUAGE_FIELD} == $language && slug.current == $slug][0]{ title }`;

const LANDING_CANDIDATES_QUERY = `*[_type == $type && ${LANGUAGE_FIELD} == $language && slug.current == $slug]{ title, "parent": parent->${LANDING_PARENT_CHAIN_PROJECTION} }`;

const isPagination = (segments: readonly string[]) =>
  segments.length === 2 &&
  segments[0] === 'page' &&
  /^\d+$/.test(segments[1] ?? '');

const findSlugPage = async (
  client: Pick<SanityClient, 'fetch'>,
  segments: readonly string[],
  language: string,
): Promise<TPublishedPage | null | undefined> => {
  const [base, slug, ...rest] = segments;
  const type = base ? SLUG_ROUTE[base] : undefined;

  if (!type || !slug) return undefined;

  const isRoutable =
    rest.length === 0 ||
    (PAGINATED_SLUG_ROUTES.has(type) && isPagination(rest));

  if (!isRoutable) return null;

  return client.fetch<TPublishedPage | null>(SLUG_PAGE_QUERY, {
    type,
    language,
    slug,
  });
};

const findLandingPage = async (
  client: Pick<SanityClient, 'fetch'>,
  segments: readonly string[],
  language: string,
): Promise<TPublishedPage | null> => {
  const slug = segments.at(-1);

  if (!slug) return null;

  const candidates = await client.fetch<TLandingCandidate[]>(
    LANDING_CANDIDATES_QUERY,
    { type: PAGE_LANDING_TYPE, language, slug },
  );
  const expected = segments.slice(0, -1).reverse().join('/');

  return (
    candidates.find(
      ({ parent }) =>
        flattenLandingParentChain(parent)
          .map((node) => node.slug)
          .join('/') === expected,
    ) ?? null
  );
};

export const findPublishedPageAtPath = async (
  client: Pick<SanityClient, 'fetch'>,
  path: string,
  language: string,
): Promise<TPublishedPage | null> => {
  if (FIXED_ROUTE.test(path)) return {};

  const segments = path.split('/').filter(Boolean);
  const slugPage = await findSlugPage(client, segments, language);

  return slugPage === undefined
    ? findLandingPage(client, segments, language)
    : slugPage;
};
