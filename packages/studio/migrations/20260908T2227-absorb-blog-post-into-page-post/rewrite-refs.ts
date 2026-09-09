import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/page-post-type';
import { at, patch, set, type Mutation, type NodePatch } from 'sanity/migrate';

type TPathSegment = string | number | { _key: string };

const hasStringKey = (value: unknown): value is { _key: string } =>
  Boolean(
    value &&
    typeof value === 'object' &&
    '_key' in value &&
    typeof (value as { _key: unknown })._key === 'string',
  );

const arrayItemSegment = (item: unknown, index: number): TPathSegment =>
  hasStringKey(item) ? { _key: item._key } : index;

const isReferenceNode = (value: unknown): value is { _ref: string } =>
  Boolean(
    value &&
    typeof value === 'object' &&
    typeof (value as { _ref?: unknown })._ref === 'string',
  );

/**
 * Deep-rewrites every `_ref` in `value` found in `idMap`, returning a fresh
 * value — used to carry a copied field (e.g. `body`'s Portable Text) across
 * onto `page_post` with its internal links already repointed.
 */
export const rewriteRefsDeep = <T>(
  value: T,
  idMap: ReadonlyMap<string, string>,
): T => {
  if (Array.isArray(value)) {
    return value.map((item) => rewriteRefsDeep(item, idMap)) as T;
  }

  if (value && typeof value === 'object') {
    const rewritten: Record<string, unknown> = {};

    for (const [key, nested] of Object.entries(value)) {
      rewritten[key] = rewriteRefsDeep(nested, idMap);
    }

    if (isReferenceNode(rewritten)) {
      const mapped = idMap.get(rewritten._ref);

      if (mapped) rewritten._ref = mapped;
    }

    return rewritten as T;
  }

  return value;
};

/**
 * `page_post.post` points at the `blog_post` it was seeded from — the one
 * field the dataset-wide rewrite below must not touch.
 */
const EXCLUDED_REF_PATHS: Record<string, (string | number)[][]> = {
  [PAGE_POST_TYPE]: [['post']],
};

const isExcludedPath = (
  excluded: (string | number)[][],
  path: TPathSegment[],
): boolean =>
  excluded.some(
    (candidate) =>
      candidate.length === path.length &&
      candidate.every((segment, index) => segment === path[index]),
  );

type TRawDocument = { _id: string; _type: string; [key: string]: unknown };

/**
 * Walks every field of `doc`, returning a single `patch` mutation rewriting
 * any `_ref` found in `idMap` to its mapped value — covers reference fields,
 * reference arrays, and reference-typed Portable Text mark definitions alike,
 * since all three shapes are plain `{ _ref }` objects somewhere in the tree.
 */
export const collectRefRewritePatches = (
  doc: TRawDocument,
  idMap: ReadonlyMap<string, string>,
): Mutation | undefined => {
  const excludedPaths = EXCLUDED_REF_PATHS[doc._type] ?? [];
  const patches: NodePatch[] = [];

  const walk = (value: unknown, path: TPathSegment[]): void => {
    if (Array.isArray(value)) {
      value.forEach((item, index) =>
        walk(item, [...path, arrayItemSegment(item, index)]),
      );
      return;
    }

    if (!value || typeof value !== 'object') return;

    if (isReferenceNode(value) && !isExcludedPath(excludedPaths, path)) {
      const mapped = idMap.get(value._ref);

      if (mapped) {
        patches.push(at([...path, '_ref'], set(mapped)));
      }
    }

    for (const [key, nested] of Object.entries(value)) {
      if (key.startsWith('_')) continue;
      walk(nested, [...path, key]);
    }
  };

  for (const [key, value] of Object.entries(doc)) {
    if (key.startsWith('_')) continue;
    walk(value, [key]);
  }

  return patches.length > 0 ? patch(doc._id, patches) : undefined;
};
