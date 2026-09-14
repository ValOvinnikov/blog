/**
 * Renames the legacy inline `link` object's stored `_type` to `inlineLink`,
 * freeing the name `link` for the new library document type (see
 * `../../src/schema-types/documents/link/link.ts` and
 * `../../src/schema-types/objects/inline-link/inline-link.ts`).
 *
 * Scoping: only `settings_footer`, `settings_navigation`, `module_hero`, and
 * `module_cta` are visited (`documentTypes` below — the only document types
 * with a field of the legacy `link` object type), and within those, only the
 * five known field paths in `./transform.ts` (`isInlineLinkPath`) are
 * eligible. Every other document type — including `page_post` and
 * `module_content`, which carry `richText`/`proseText` fields — is never
 * visited by this migration at all, so their default `link` href annotation
 * (a different, Sanity-builtin object sharing only the `_type` string with
 * ours) is never touched.
 *
 * Idempotency: `renameInlineLinkType` only acts on nodes whose `_type` is
 * still the legacy `link`; a node already renamed to `inlineLink` (from a
 * prior partial run) no longer matches and is left untouched — safe to
 * re-run.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter @blog/studio dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter @blog/studio migrate:dry` — inspect the diff
 *   3. `pnpm --filter @blog/studio migrate:run` — human-gated, mutates `production`
 *
 * Deploy-ordering constraint: run this against `production` *before*
 * deploying Studio code that expects the legacy inline link object to be
 * named `inlineLink` rather than `link`, so there is no window where live
 * documents carry the old `_type` for a schema that only recognizes the new
 * one.
 */
import { defineMigration, set } from 'sanity/migrate';

import { renameInlineLinkType, type TInlineLinkNode } from './transform';

export default defineMigration({
  title: 'Rename inline link object type from link to inlineLink',
  documentTypes: [
    'settings_footer',
    'settings_navigation',
    'module_hero',
    'module_cta',
  ],
  migrate: {
    object(node, path) {
      const renamed = renameInlineLinkType(
        node as unknown as TInlineLinkNode,
        path,
      );

      return renamed ? set(renamed) : undefined;
    },
  },
});
