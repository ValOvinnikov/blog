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

/** `module_cta.content[].markDefs[]` — the `link` annotation on the `inlineText` field. */
const isCtaContentAnnotationPath = (path: Path): boolean =>
  path.length === 4 &&
  path[0] === 'content' &&
  isKeyedSegment(path[1]) &&
  path[2] === 'markDefs' &&
  isKeyedSegment(path[3]);

/** `module_heroBlog.secondaryAction.link` — a standalone `ctaAction` field, not one held by an `actionGroup`. */
const isHeroBlogSecondaryActionLinkPath = (path: Path): boolean =>
  path.length === 2 && path[0] === 'secondaryAction' && path[1] === 'link';

/** True only for a path at one of the known locations where the legacy `link` object is actually used. */
export const isInlineLinkPath = (path: Path): boolean =>
  isHeroSecondaryActionPath(path) ||
  isCtaActionLinkPath(path) ||
  isCtaContentAnnotationPath(path) ||
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
