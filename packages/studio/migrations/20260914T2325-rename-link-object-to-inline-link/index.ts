/**
 * Renames the legacy inline `link` object's stored `_type` to `inlineLink`,
 * matching the object type as renamed in
 * `../../src/schema-types/objects/inline-link/inline-link.ts`.
 *
 * Scoping: `documentTypes` below lists every document type that embeds an
 * `inlineLink` field, directly or through a shared field factory
 * (`heroFields()` spreads `actionGroupField()` into `module_heroBlog` and
 * `module_heroStatement`) — see `./index.test.ts` for the schema-graph
 * derivation this list is checked against. Within those, only the known
 * field paths in `./transform.ts` (`isInlineLinkPath`) are eligible. Every
 * other document type — including `page_post` and `module_content`, which
 * carry `richText`/`proseText` fields — is never visited by this migration
 * at all, so their default `link` href annotation (a different,
 * Sanity-builtin object sharing only the `_type` string with ours) is never
 * touched.
 *
 * Idempotency: `renameInlineLinkType` only acts on nodes whose `_type` is
 * still the legacy `link`; a node already renamed to `inlineLink` (from a
 * prior partial run) no longer matches and is left untouched — safe to
 * re-run. See `../README.md` for the dry-run/backup/apply workflow.
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
    'module_cta',
    'module_hero',
    'module_heroBlog',
    'module_heroStatement',
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
