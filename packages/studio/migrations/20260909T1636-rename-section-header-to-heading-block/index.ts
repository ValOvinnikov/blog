/**
 * Renames the shared `sectionHeader` field to `headingBlock`, and rewrites
 * its nested `_type` (`sectionHeader` -> `headingBlock`,
 * `requiredHeadingSectionHeader` -> `requiredHeadingBlock`) to match the
 * `objects/heading-block.ts` schema rename, across every document type that
 * carries the field: `page_home`, `page_post`, `module_cta`,
 * `module_newsletter`, `module_postFeatured`, `module_postLatest`,
 * `module_postList`, `module_postRelated`, `module_taxonomyList`.
 *
 * Idempotency guard: skips documents where `headingBlock` (the *target*
 * field) is already set, regardless of whether `sectionHeader` (the
 * *source* field) is still present — a doc that already has both must not
 * be re-wrapped or clobbered. Docs that never had a `sectionHeader` are a
 * no-op too, since there is nothing to move.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter @blog/studio dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter @blog/studio migrate:dry` — inspect the diff
 *   3. `pnpm --filter @blog/studio migrate:run` — human-gated, mutates `production`
 *
 * Runs after `20260908T2227-absorb-blog-post-into-page-post`, which writes
 * fresh `page_post` documents carrying the legacy `sectionHeader` shape —
 * this migration converts those in the same pass as every pre-existing
 * document.
 */
import { at, defineMigration, set, unset } from 'sanity/migrate';

const HEADING_BLOCK_TYPE_BY_LEGACY_TYPE: Record<string, string> = {
  sectionHeader: 'headingBlock',
  requiredHeadingSectionHeader: 'requiredHeadingBlock',
};

type TLegacyHeadingBlockValue = {
  _type: string;
  [key: string]: unknown;
};

type TLegacyHeadingBlockDoc = {
  sectionHeader?: TLegacyHeadingBlockValue;
  headingBlock?: unknown;
};

export const renameSectionHeaderToHeadingBlock = (
  doc: TLegacyHeadingBlockDoc,
) => {
  if (doc.headingBlock !== undefined) return undefined;
  if (doc.sectionHeader === undefined) return undefined;

  const { _type: legacyType, ...rest } = doc.sectionHeader;
  const headingBlockType =
    HEADING_BLOCK_TYPE_BY_LEGACY_TYPE[legacyType] ?? legacyType;

  return [
    at('headingBlock', set({ _type: headingBlockType, ...rest })),
    at('sectionHeader', unset()),
  ];
};

const DOCUMENT_TYPES = [
  'page_home',
  'page_post',
  'module_cta',
  'module_newsletter',
  'module_postFeatured',
  'module_postLatest',
  'module_postList',
  'module_postRelated',
  'module_taxonomyList',
];

export default defineMigration({
  title: 'Rename sectionHeader to headingBlock',
  documentTypes: DOCUMENT_TYPES,
  migrate: {
    document(doc) {
      return renameSectionHeaderToHeadingBlock(
        doc as unknown as TLegacyHeadingBlockDoc,
      );
    },
  },
});
