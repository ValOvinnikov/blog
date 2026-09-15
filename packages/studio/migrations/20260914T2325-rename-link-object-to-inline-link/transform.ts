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

/** `<...>.actions.actions[].link` — the `link` field of each `ctaAction` held by an `actionGroup`'s `actions` field. */
const isCtaActionLinkPath = (path: Path): boolean =>
  path.length === 4 &&
  path[0] === 'actions' &&
  path[1] === 'actions' &&
  isKeyedSegment(path[2]) &&
  path[3] === 'link';

/** `module_heroBlog.secondaryAction.link` — a standalone `ctaAction` field, not one held by an `actionGroup`. */
const isHeroBlogSecondaryActionLinkPath = (path: Path): boolean =>
  path.length === 2 && path[0] === 'secondaryAction' && path[1] === 'link';

/** True only for a path at one of the known locations where the legacy `link` object is actually used. */
export const isInlineLinkPath = (path: Path): boolean =>
  isFooterSocialLinkPath(path) ||
  isNavigationItemLinkPath(path) ||
  isHeroSecondaryActionPath(path) ||
  isCtaActionLinkPath(path) ||
  isHeroBlogSecondaryActionLinkPath(path);

/** Pure transform: renames a legacy `link` node's `_type` to `inlineLink`, preserving every other field. */
export const renameInlineLinkType = (
  node: TInlineLinkNode,
  path: Path,
): TInlineLinkNode | undefined => {
  if (node._type !== LEGACY_TYPE) return undefined;
  if (!isInlineLinkPath(path)) return undefined;

  return { ...node, _type: TARGET_TYPE };
};
