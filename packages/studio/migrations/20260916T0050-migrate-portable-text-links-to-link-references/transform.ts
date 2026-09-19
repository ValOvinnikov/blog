import { LINK_TYPE } from '@blog/config/constants';
import type { MigrationContext, Path } from 'sanity/migrate';

import { LINK_LABEL_MAX_LENGTH } from '../lib/link-label-max-length';

const LINK_DOCUMENT_TYPE = 'link';
const LINK_REF_TYPE = 'linkRef';
const RAW_HREF_MARK_TYPE = 'link';
const INLINE_LINK_MARK_TYPE = 'inlineLink';

const BLOG_POST_HREF_PATTERN = /^\/blog\/([^/]+)\/?$/;
const EXTERNAL_URL_PATTERN = /^https?:\/\//;

type TLegacyInlineLink = {
  label?: string;
  accessibleLabel?: string;
  linkType?: string;
  internalReference?: { _ref?: string };
  url?: string;
  openInNewTab?: boolean;
  platform?: string;
};

export type TRawHrefMarkDef = {
  _key: string;
  _type: typeof RAW_HREF_MARK_TYPE;
  href?: string;
};

export type TInlineLinkMarkDef = TLegacyInlineLink & {
  _key: string;
  _type: typeof INLINE_LINK_MARK_TYPE;
};

type TLinkRefMarkDef = {
  _key: string;
  _type: typeof LINK_REF_TYPE;
  link: { _type: 'reference'; _ref: string };
};

export type TMarkDef =
  | TRawHrefMarkDef
  | TInlineLinkMarkDef
  | TLinkRefMarkDef
  | { _key: string; _type: string; [key: string]: unknown };

export type TSpan = {
  _key: string;
  _type: string;
  marks?: string[];
  [key: string]: unknown;
};

export type TBlock = {
  _key: string;
  _type: 'block';
  markDefs?: TMarkDef[];
  children?: TSpan[];
  [key: string]: unknown;
};

export const isLegacyMarkDefType = (type: string): boolean =>
  type === RAW_HREF_MARK_TYPE || type === INLINE_LINK_MARK_TYPE;

export const isRawHrefMarkDef = (
  markDef: TMarkDef,
): markDef is TRawHrefMarkDef => markDef._type === RAW_HREF_MARK_TYPE;

type TJsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is TJsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isBlockNode = (value: unknown): value is TBlock =>
  isRecord(value) &&
  value._type === 'block' &&
  typeof value._key === 'string' &&
  Array.isArray(value.markDefs);

const hasLegacyMarkDef = (block: TBlock): boolean =>
  (block.markDefs ?? []).some((markDef) => isLegacyMarkDefType(markDef._type));

export type TBlockLocation = { path: Path; block: TBlock };

/** Finds every Portable Text block carrying a legacy link markDef, at any nesting depth in the raw document. */
export const findLegacyLinkBlocks = (
  node: unknown,
  path: Path = [],
): TBlockLocation[] => {
  if (isBlockNode(node)) {
    return hasLegacyMarkDef(node) ? [{ path, block: node }] : [];
  }

  if (Array.isArray(node)) {
    return node.flatMap((item, index) =>
      findLegacyLinkBlocks(item, [
        ...path,
        isRecord(item) && typeof item._key === 'string'
          ? { _key: item._key }
          : index,
      ]),
    );
  }

  if (isRecord(node)) {
    return Object.entries(node).flatMap(([key, value]) =>
      findLegacyLinkBlocks(value, [...path, key]),
    );
  }

  return [];
};

export type TDestination = TLegacyInlineLink & {
  title: string;
  label: string;
};

const truncateLabel = (label: string): string => {
  const truncated = label.slice(0, LINK_LABEL_MAX_LENGTH);
  const lastSpace = truncated.lastIndexOf(' ');

  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated).trimEnd();
};

const toLabel = (candidate: string | undefined, fallback: string): string => {
  const label = candidate?.trim() || fallback;

  return label.length > LINK_LABEL_MAX_LENGTH ? truncateLabel(label) : label;
};

/** A short, readable label derived from a URL when no visible link text exists. */
export const deriveExternalLabel = (url: string): string => {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, '');
    const path = parsed.pathname === '/' ? '' : parsed.pathname;
    const full = `${hostname}${path}`;

    return full.length > LINK_LABEL_MAX_LENGTH
      ? toLabel(hostname, hostname)
      : full;
  } catch {
    return toLabel(url, url);
  }
};

const resolveInternalPostBySlug = async (
  context: MigrationContext,
  slug: string,
): Promise<{ _id: string; title?: string } | undefined> => {
  const results = await context.client.fetch<{ _id: string; title?: string }[]>(
    '*[_type == "page_post" && slug.current == $slug]{ _id, title }',
    {
      slug,
    },
  );

  return results.find((doc) => !doc._id.startsWith('drafts.')) ?? results[0];
};

/** Resolves a raw-`href` markDef to its destination — an internal `/blog/<slug>` path against `page_post`, or a full `https?://` URL; anything else, including a slug matching no post, resolves to `undefined`. */
export const resolveRawHrefDestination = async (
  context: MigrationContext,
  href: string | undefined,
): Promise<TDestination | undefined> => {
  if (!href) return undefined;

  const blogMatch = BLOG_POST_HREF_PATTERN.exec(href);

  if (blogMatch) {
    const slug = blogMatch[1] as string;
    const post = await resolveInternalPostBySlug(context, slug);

    if (!post) return undefined;

    const title = post.title ?? slug;

    return {
      linkType: LINK_TYPE.INTERNAL,
      internalReference: { _ref: post._id },
      title: `Link to ${title}`,
      label: toLabel(title, title),
    };
  }

  if (EXTERNAL_URL_PATTERN.test(href)) {
    return {
      linkType: LINK_TYPE.EXTERNAL,
      url: href,
      title: `Link to ${href}`,
      label: deriveExternalLabel(href),
    };
  }

  return undefined;
};

export const resolveInlineLinkDestination = async (
  context: MigrationContext,
  markDef: TInlineLinkMarkDef,
): Promise<TDestination | undefined> => {
  if (
    markDef.linkType === LINK_TYPE.INTERNAL &&
    markDef.internalReference?._ref
  ) {
    const ref = markDef.internalReference._ref;
    const target = await context.client.fetch<{ title?: string } | null>(
      '*[_id == $ref][0]{ title }',
      { ref },
    );
    const title = target?.title ?? ref;

    return {
      linkType: LINK_TYPE.INTERNAL,
      internalReference: { _ref: ref },
      title: `Link to ${title}`,
      label: toLabel(markDef.label, title),
    };
  }

  if (markDef.linkType === LINK_TYPE.EXTERNAL && markDef.url) {
    return {
      linkType: LINK_TYPE.EXTERNAL,
      url: markDef.url,
      title: `Link to ${markDef.url}`,
      label: toLabel(markDef.label, deriveExternalLabel(markDef.url)),
    };
  }

  return undefined;
};

export type TLinkDocumentFields = {
  _id: string;
  _type: typeof LINK_DOCUMENT_TYPE;
  title: string;
  label: string;
  linkType: string;
  internalReference?: { _type: 'reference'; _ref: string };
  url?: string;
};

export const buildLinkDocumentFields = (
  linkId: string,
  destination: TDestination,
): TLinkDocumentFields => ({
  _id: linkId,
  _type: LINK_DOCUMENT_TYPE,
  title: destination.title,
  label: destination.label,
  linkType: destination.linkType as string,
  ...(destination.linkType === LINK_TYPE.INTERNAL &&
  destination.internalReference?._ref
    ? {
        internalReference: {
          _type: 'reference' as const,
          _ref: destination.internalReference._ref,
        },
      }
    : {}),
  ...(destination.linkType === LINK_TYPE.EXTERNAL && destination.url
    ? { url: destination.url }
    : {}),
});

/** A short, human-readable description of a markDef's destination, for a strip warning. */
export const describeMarkDef = (markDef: TMarkDef): string => {
  if (isRawHrefMarkDef(markDef)) {
    return markDef.href ?? '(no href set)';
  }

  const inlineLink = markDef as TInlineLinkMarkDef;

  return (
    inlineLink.url ??
    inlineLink.internalReference?._ref ??
    '(no destination set)'
  );
};

export type TMarkDefOutcome =
  | { outcome: 'CONVERTED'; key: string; linkId: string }
  | { outcome: 'STRIPPED'; key: string };

/** Applies pre-resolved per-markDef outcomes to a block. Stripping removes both the markDef and the mark referencing it on every span — dropping only one would leave a dangling mark. */
export const applyMarkDefOutcomes = (
  block: TBlock,
  outcomes: TMarkDefOutcome[],
): { markDefs: TMarkDef[]; children: TSpan[] } => {
  const outcomeByKey = new Map(
    outcomes.map((outcome) => [outcome.key, outcome]),
  );
  const strippedKeys = new Set(
    outcomes
      .filter((outcome) => outcome.outcome === 'STRIPPED')
      .map((outcome) => outcome.key),
  );

  const markDefs = (block.markDefs ?? []).flatMap((markDef): TMarkDef[] => {
    const outcome = outcomeByKey.get(markDef._key);

    if (!outcome) return [markDef];
    if (outcome.outcome === 'STRIPPED') return [];

    return [
      {
        _key: markDef._key,
        _type: LINK_REF_TYPE,
        link: { _type: 'reference', _ref: outcome.linkId },
      },
    ];
  });

  const children = (block.children ?? []).map((span) => {
    if (!Array.isArray(span.marks)) return span;

    const marks = span.marks.filter((key) => !strippedKeys.has(key));

    return marks.length === span.marks.length ? span : { ...span, marks };
  });

  return { markDefs, children };
};
