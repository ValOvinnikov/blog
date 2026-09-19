/**
 * Migrates every Portable Text body-text link — both the built-in raw-`href`
 * markDef and the structured `inlineLink` annotation — onto `linkRef`
 * references to standalone `link` documents.
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

import { toLinkId, toLinkIdentityKey } from '../lib/link-identity';

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
