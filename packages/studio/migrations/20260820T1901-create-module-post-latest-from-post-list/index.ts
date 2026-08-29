/**
 * Creates a `module_postLatest` document from each `module_postList` under a
 * deterministic id, then repoints any `page_home.modules[]` reference at it.
 * `_type` is immutable in Sanity, so this is create + repoint, not a patch —
 * the legacy `module_postList` document is left in place; delete it with the
 * separate delete-legacy-module-post-list migration, run only after this one
 * has completed against the same dataset.
 */
import { at, createIfNotExists, defineMigration, set } from 'sanity/migrate';

import { toPostLatestId } from './id';

type TLegacyPostListDoc = {
  _id: string;
  title?: string;
  brandVariant?: string;
  sectionHeader?: unknown;
  limit?: number;
  layout?: unknown;
};

type TModuleReferenceItem = {
  _key: string;
  _type: string;
  _ref: string;
};

type THomePageDoc = {
  _id: string;
  modules?: TModuleReferenceItem[];
};

/** Must match `module_postLatest`'s `limit` field `.max()` in the schema. */
const POST_LATEST_LIMIT_MAX = 12;

/**
 * `module_postList.limit` currently allows up to 24 (E2), wider than the new
 * `module_postLatest.limit` (1-12) — clamp rather than copy verbatim, or a
 * source document above 12 would produce a target document its own schema
 * rejects, blocking the editor from publishing it.
 */
const clampToPostLatestLimit = (limit?: number): number | undefined =>
  limit === undefined ? undefined : Math.min(limit, POST_LATEST_LIMIT_MAX);

export default defineMigration({
  title:
    'Create module_postLatest documents from module_postList and repoint page_home.modules[]',
  documentTypes: ['module_postList', 'page_home'],

  migrate: {
    document(doc) {
      if (doc._type === 'module_postList') {
        const postList = doc as unknown as TLegacyPostListDoc;

        return [
          createIfNotExists({
            _id: toPostLatestId(postList._id),
            _type: 'module_postLatest',
            title: postList.title,
            brandVariant: postList.brandVariant,
            sectionHeader: postList.sectionHeader,
            limit: clampToPostLatestLimit(postList.limit),
            layout: postList.layout,
          }),
        ];
      }

      const page = doc as unknown as THomePageDoc;
      const legacyItems = (page.modules ?? []).filter(
        (item) => item._type === 'module_postList',
      );

      if (legacyItems.length === 0) {
        return undefined;
      }

      return legacyItems.map((item) =>
        at(
          ['modules', { _key: item._key }],
          set({
            _key: item._key,
            _type: 'module_postLatest',
            _ref: toPostLatestId(item._ref),
          }),
        ),
      );
    },
  },
});
