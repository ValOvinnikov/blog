import type { Path } from 'sanity/migrate';

/** The stored `_type` before this migration — see `objects/inline-link/inline-link.ts`. */
const LEGACY_TYPE = 'link';
/** The stored `_type` after this migration — see `objects/inline-link/inline-link.ts`. */
const TARGET_TYPE = 'inlineLink';

export type TInlineLinkNode = {
  _type: string;
  [key: string]: unknown;
};

const isKeyedSegment = (segment: Path[number] | undefined): boolean =>
  typeof segment === 'object' && segment !== null && '_key' in segment;

/** `settings_footer.social[]` — each array member is an inline link. */
const isFooterSocialLinkPath = (path: Path): boolean =>
  path.length === 2 && path[0] === 'social' && isKeyedSegment(path[1]);

/** `settings_navigation.items[]` — each array member is an inline link. */
const isNavigationItemLinkPath = (path: Path): boolean =>
  path.length === 2 && path[0] === 'items' && isKeyedSegment(path[1]);

/** `module_hero.secondaryAction` — a single, non-array inline link field. */
const isHeroSecondaryActionPath = (path: Path): boolean =>
  path.length === 1 && path[0] === 'secondaryAction';

/** `module_cta.actions.actions[].link` — the `link` field of each `ctaAction`. */
const isCtaActionLinkPath = (path: Path): boolean =>
  path.length === 4 &&
  path[0] === 'actions' &&
  path[1] === 'actions' &&
  isKeyedSegment(path[2]) &&
  path[3] === 'link';

/**
 * `module_cta.content[].markDefs[]` — `content` is an `inlineText` field,
 * which (unlike `richText`/`proseText`) explicitly declares its own `link`
 * annotation rather than inheriting Sanity's default `link` href annotation.
 */
const isCtaContentAnnotationPath = (path: Path): boolean =>
  path.length === 4 &&
  path[0] === 'content' &&
  isKeyedSegment(path[1]) &&
  path[2] === 'markDefs' &&
  isKeyedSegment(path[3]);

/**
 * True only for a path at one of the five known locations where the legacy
 * `link` object is actually used. This is what keeps the migration from ever
 * touching a `richText`/`proseText` field's default `link` href annotation —
 * those live on document types (`page_post`, `module_content`, …) that are
 * never included in this migration's `documentTypes`, and even within the
 * four document types that are included, no other field happens to reuse
 * this same path shape.
 */
export const isInlineLinkPath = (path: Path): boolean =>
  isFooterSocialLinkPath(path) ||
  isNavigationItemLinkPath(path) ||
  isHeroSecondaryActionPath(path) ||
  isCtaActionLinkPath(path) ||
  isCtaContentAnnotationPath(path);

/**
 * Pure transform: renames a legacy `link` node's `_type` to `inlineLink`,
 * preserving every other field. Returns `undefined` (no-op) for anything
 * that isn't a legacy inline link at one of the known paths — this is both
 * the scoping guard and the idempotency guard: a node already renamed to
 * `inlineLink` no longer matches `LEGACY_TYPE` and is left alone.
 */
export const renameInlineLinkType = (
  node: TInlineLinkNode,
  path: Path,
): TInlineLinkNode | undefined => {
  if (node._type !== LEGACY_TYPE) return undefined;
  if (!isInlineLinkPath(path)) return undefined;

  return { ...node, _type: TARGET_TYPE };
};
