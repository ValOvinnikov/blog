/**
 * Folds `page_tagIndex.taxonomyList` into `modules[]` as a
 * `module_taxonomyList` array member, backfills the new `headingBlock`
 * object from the legacy `heading`/`supportingText` pair, and authors
 * `taxonomy: 'TAGS'` on any referenced `module_taxonomyList` document that
 * doesn't already have one — three independent transforms applied to every
 * `page_tagIndex` and `module_taxonomyList` document (published and draft).
 *
 * The `taxonomy` backfill exists because folding the reference into
 * `modules[]` removes the only channel (a dedicated slot passing a
 * `fallbackTaxonomy`) that let an un-authored module still resolve which
 * terms to list — `ModuleRenderer` has no way to supply that fallback to a
 * generically rendered module.
 *
 * Idempotency guards:
 *   - The `taxonomyList` fold is skipped once `modules[]` already contains a
 *     member referencing the same document — matched on `_ref` alone, so a
 *     document carrying both the legacy field and the folded module is
 *     never re-wrapped or duplicated.
 *   - The `headingBlock` backfill is skipped once `headingBlock` is already
 *     set, regardless of whether `heading`/`supportingText` are still
 *     present.
 *   - A document with no `taxonomyList` reference, or with neither
 *     `heading` nor `supportingText` set, produces no patch for that half —
 *     never an error.
 *   - The `taxonomy` backfill is skipped once the module already has a
 *     `taxonomy` — including one set to `TOPICS` — and skipped entirely for a
 *     `module_taxonomyList` no `page_tagIndex` references.
 *
 * The legacy `taxonomyList`, `heading` and `supportingText` fields are left
 * in place; they stay `readOnly` and `deprecated` in the schema until a
 * follow-up migration unsets them once every consumer reads the new shape.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter @blog/studio dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter @blog/studio migrate:dry` — inspect the diff
 *   3. `pnpm --filter @blog/studio migrate:run` — human-gated, mutates `production`
 *
 * Deploy-ordering constraint: run this against a dataset *before* deploying
 * service/web code that reads `modules[]`/`headingBlock` instead of
 * `taxonomyList`/`heading`/`supportingText`.
 */
import {
  at,
  defineMigration,
  prepend,
  setIfMissing,
  type MigrationContext,
} from 'sanity/migrate';

import {
  authorTaxonomyOnModule,
  type TTaxonomyListModuleDoc,
} from './author-taxonomy-on-module';
import { getReferencedTaxonomyListIds } from './referenced-taxonomy-list-ids';

const TAXONOMY_LIST_MODULE_TYPE = 'module_taxonomyList';

type TModuleReference = { _key: string; _type: string; _ref: string };

export type TTagIndexPageDoc = {
  taxonomyList?: { _ref?: string };
  modules?: TModuleReference[];
  heading?: string;
  supportingText?: string;
  headingBlock?: unknown;
};

export const toTaxonomyListModuleKey = (ref: string): string =>
  `taxonomyList-${ref}`;

export const foldTaxonomyListIntoModules = (doc: TTagIndexPageDoc) => {
  const ref = doc.taxonomyList?._ref;

  if (!ref) return undefined;

  const alreadyReferenced = (doc.modules ?? []).some(
    (module) => module._ref === ref,
  );

  if (alreadyReferenced) return undefined;

  return [
    at('modules', setIfMissing([])),
    at(
      'modules',
      prepend([
        {
          _key: toTaxonomyListModuleKey(ref),
          _type: TAXONOMY_LIST_MODULE_TYPE,
          _ref: ref,
        },
      ]),
    ),
  ];
};

export const backfillHeadingBlock = (doc: TTagIndexPageDoc) => {
  if (doc.headingBlock !== undefined) return undefined;
  if (doc.heading === undefined && doc.supportingText === undefined) {
    return undefined;
  }

  return [
    at(
      'headingBlock',
      setIfMissing({
        heading: doc.heading,
        supportingText: doc.supportingText,
      }),
    ),
  ];
};

export const migrateTagIndexPage = (doc: TTagIndexPageDoc) => {
  const patches = [
    ...(foldTaxonomyListIntoModules(doc) ?? []),
    ...(backfillHeadingBlock(doc) ?? []),
  ];

  return patches.length > 0 ? patches : undefined;
};

export default defineMigration({
  title:
    'Fold page_tagIndex taxonomyList into modules[], backfill headingBlock, and author module taxonomy',
  documentTypes: ['page_tagIndex', TAXONOMY_LIST_MODULE_TYPE],
  migrate: {
    async document(doc, context: MigrationContext) {
      if (doc._type === TAXONOMY_LIST_MODULE_TYPE) {
        const referencedIds = await getReferencedTaxonomyListIds(context);

        return (
          authorTaxonomyOnModule(
            doc as unknown as TTaxonomyListModuleDoc,
            referencedIds,
          ) ?? []
        );
      }

      return migrateTagIndexPage(doc as unknown as TTagIndexPageDoc) ?? [];
    },
  },
});
