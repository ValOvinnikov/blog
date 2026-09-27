/**
 * Retypes each multi-column module's `layout` field from the shared `layout`
 * object to the new `wideLayout` object (#3770), which drops Container Width
 * Narrow — CardGrid-based modules render broken at Narrow regardless of
 * viewport. See `../../src/schema-types/objects/wide-layout/wide-layout.ts`.
 *
 * Scoping: only the eleven multi-column module document types are visited
 * (`documentTypes` below), and within those, only the `layout` field itself
 * (`isLayoutFieldPath` in `./transform.ts`) — never a nested object that
 * happens to share the field name.
 *
 * Idempotency: `widenModuleLayoutType` only acts on nodes whose `_type` is
 * still the legacy `layout`; a node already retyped to `wideLayout` (from a
 * prior partial run) no longer matches and is left untouched — safe to
 * re-run.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter @blog/studio dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter @blog/studio migrate:dry` — inspect the diff
 *   3. `pnpm --filter @blog/studio migrate:run` — human-gated, mutates `production`
 */
import { defineMigration, set } from 'sanity/migrate';

import { widenModuleLayoutType, type TModuleLayoutNode } from './transform';

export default defineMigration({
  title: 'Widen layout type on multi-column modules',
  documentTypes: [
    'module_featureHighlights',
    'module_featureList',
    'module_postFeatured',
    'module_postLatest',
    'module_postList',
    'module_postRelated',
    'module_pricing',
    'module_stats',
    'module_taxonomyList',
    'module_team',
    'module_testimonial',
  ],
  migrate: {
    object(node, path) {
      const widened = widenModuleLayoutType(
        node as unknown as TModuleLayoutNode,
        path,
      );

      return widened ? set(widened) : undefined;
    },
  },
});
