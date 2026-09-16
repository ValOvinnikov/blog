/**
 * Migrates every Portable Text body-text link to the shared `link` library.
 *
 * Two legacy annotation shapes exist in stored `markDefs`:
 *   - `link` — Sanity's built-in raw-`href` annotation, inherited by
 *     `richText`/`proseText` before they declared `marks.annotations`
 *     explicitly.
 *   - `inlineLink` — the structured annotation `inlineText` declared before
 *     switching to `linkRef`.
 *
 * Per Portable Text block found anywhere in a scanned document (any nesting
 * depth, including a `richText` block's nested `aside.body`):
 *   1. Resolve each legacy markDef's destination — a `/blog/<slug>` href
 *      against `page_post` by slug, a full `https?://` URL as-is, or an
 *      already-structured `inlineLink`'s own reference/url.
 *   2. `createIfNotExists` a `link` document for each resolved destination,
 *      deduped by a deterministic id derived from the destination itself
 *      (`id.ts`) — the same destination collapses onto one `link` document
 *      wherever it recurs.
 *   3. Replace the markDef with a `linkRef` pointing at that document.
 *   4. When a destination resolves to nothing (an internal path matching no
 *      `page_post`), remove the markDef and the mark referencing it from
 *      every span instead, leaving the words as plain text — reported via
 *      `console.warn` rather than dropped silently.
 *
 * A markDef carries no visible label, so the seeded `link.label` is derived:
 * the resolved `page_post`'s title for an internal destination, a short
 * hostname-based string for an external one — both reported via
 * `console.warn` so an editor can review them before a real run.
 *
 * Idempotency: a document with no legacy markDef anywhere returns no
 * mutations; `link` document creation is `createIfNotExists`, so a re-run
 * creates nothing twice.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter @blog/studio dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter @blog/studio migrate:dry` — inspect the diff and warnings
 *   3. `pnpm --filter @blog/studio migrate:run` — human-gated, mutates the dataset
 */
import {
  at,
  createIfNotExists,
  defineMigration,
  patch,
  set,
  type MigrationContext,
  type Mutation,
  type NodePatch,
} from 'sanity/migrate';

import { toLinkId, toLinkIdentityKey } from './id';
import {
  applyMarkDefOutcomes,
  buildLinkDocumentFields,
  describeMarkDef,
  findLegacyLinkBlocks,
  isLegacyMarkDefType,
  isRawHrefMarkDef,
  resolveInlineLinkDestination,
  resolveRawHrefDestination,
  type TInlineLinkMarkDef,
  type TMarkDef,
  type TMarkDefOutcome,
} from './transform';

const DOCUMENT_TYPES = [
  'blog_author',
  'page_post',
  'module_cta',
  'module_content',
];

type TMinimalDocument = { _id: string };

const warn = (message: string): void => {
  // eslint-disable-next-line no-console -- migrate:dry/migrate:run have no other channel to surface a migration anomaly to the operator running it
  console.warn(message);
};

const resolveOutcomesForBlock = async (
  docId: string,
  markDefs: TMarkDef[] | undefined,
  context: MigrationContext,
  mutations: Mutation[],
  queuedLinkIds: Set<string>,
): Promise<TMarkDefOutcome[]> => {
  const outcomes: TMarkDefOutcome[] = [];

  for (const markDef of markDefs ?? []) {
    if (!isLegacyMarkDefType(markDef._type)) continue;

    const destination = isRawHrefMarkDef(markDef)
      ? await resolveRawHrefDestination(context, markDef.href)
      : await resolveInlineLinkDestination(
          context,
          markDef as TInlineLinkMarkDef,
        );
    const identityKey = destination
      ? toLinkIdentityKey(destination)
      : undefined;

    if (!destination || !identityKey) {
      warn(
        `${docId}: stripped a link with no resolvable destination (${describeMarkDef(markDef)}) — left as plain text.`,
      );
      outcomes.push({ outcome: 'STRIPPED', key: markDef._key });
      continue;
    }

    const linkId = toLinkId(identityKey);

    if (!queuedLinkIds.has(linkId)) {
      queuedLinkIds.add(linkId);

      const fields = buildLinkDocumentFields(linkId, destination);

      mutations.push(createIfNotExists(fields));
      warn(
        `Seeding link "${fields._id}" — label: "${fields.label}", title: "${fields.title}".`,
      );
    }

    outcomes.push({ outcome: 'CONVERTED', key: markDef._key, linkId });
  }

  return outcomes;
};

export default defineMigration({
  title: 'Migrate Portable Text links to linkRef references',
  documentTypes: DOCUMENT_TYPES,
  migrate: {
    async document(rawDoc, context) {
      const doc = rawDoc as unknown as TMinimalDocument;
      const blockLocations = findLegacyLinkBlocks(rawDoc);

      if (blockLocations.length === 0) return [];

      const mutations: Mutation[] = [];
      const patchOps: NodePatch[] = [];
      const queuedLinkIds = new Set<string>();

      for (const { path, block } of blockLocations) {
        const outcomes = await resolveOutcomesForBlock(
          doc._id,
          block.markDefs,
          context,
          mutations,
          queuedLinkIds,
        );
        const { markDefs, children } = applyMarkDefOutcomes(block, outcomes);

        patchOps.push(at([...path, 'markDefs'], set(markDefs)));
        patchOps.push(at([...path, 'children'], set(children)));
      }

      mutations.push(patch(doc._id, patchOps));

      return mutations;
    },
  },
});
