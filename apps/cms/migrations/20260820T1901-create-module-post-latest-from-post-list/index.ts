/**
 * Creates a `module_postLatest` document from each `module_postList` (the
 * teaser role, now split into its own type) under a deterministic id, then
 * repoints any `page_home.modules[]` reference at it. `_type` is immutable in
 * Sanity, so this is create + repoint, not a patch — the legacy
 * `module_postList` document is left in place and removed by a separate
 * follow-up migration once every reference has moved.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter cms dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter cms migrate:dry` — inspect the diff
 *   3. `pnpm --filter cms migrate:run` — human-gated, mutates `production`
 *
 * Run this before the delete-legacy-module-post-list migration, against the
 * same dataset — a document with incoming strong references cannot be
 * deleted.
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
            limit: postList.limit,
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
