import type { Path } from 'sanity/migrate';

/** The stored `_type` before this migration — see `objects/image-with-alt.ts`. */
const LEGACY_TYPE = 'imageWithAlt';
/** The stored `_type` after this migration — see `objects/body-image.ts`. */
const TARGET_TYPE = 'bodyImage';

/** A body-image node as it appears in a `body[]` richText array, either shape. */
export type TBodyArrayImageNode = {
  _type: string;
  [key: string]: unknown;
};

/**
 * True only for a path that is exactly a keyed element of the top-level
 * `body` array (`['body', { _key: '...' }]`) — i.e. the array member itself,
 * not something nested deeper inside it (e.g. a block's `children`). This is
 * what keeps the migration from ever touching `heroImage` (not an array), a
 * `blog_author.avatar`, a `brand` logo, `openGraph.image`, or any
 * site-settings image — none of those live under a `body` path.
 */
export const isBodyArrayItemPath = (path: Path): boolean => {
  if (path.length !== 2 || path[0] !== 'body') return false;

  const [, segment] = path;
  return typeof segment === 'object' && segment !== null && '_key' in segment;
};

/**
 * Pure transform: renames a `body[]` array item's `_type` from the legacy
 * `imageWithAlt` to `bodyImage`, preserving every other field (`asset`,
 * `hotspot`, `crop`, `alt`) unchanged. Returns `undefined` (no-op) for
 * anything that isn't a legacy body image at a `body[]` array path —
 * this is both the scoping guard and the idempotency guard: a node already
 * renamed to `bodyImage` no longer matches `LEGACY_TYPE` and is left alone.
 */
export const renameBodyImageType = (
  node: TBodyArrayImageNode,
  path: Path,
): TBodyArrayImageNode | undefined => {
  if (node._type !== LEGACY_TYPE) return undefined;
  if (!isBodyArrayItemPath(path)) return undefined;

  return { ...node, _type: TARGET_TYPE };
};
