/**
 * Drops the deprecated top-level `heading`/`supportingText` fields from
 * `page_tagIndex` and `page_topicIndex`, now that `headingBlock` is the only
 * schema-declared source for both. Either legacy field is moved into the
 * matching `headingBlock` slot first when that slot is still empty, so a
 * document that was never backfilled by an earlier migration keeps its copy
 * instead of losing it; a document whose `headingBlock` already carries its
 * own value is left alone there and just has the legacy field unset.
 *
 * Idempotency guard: a legacy field is only unset when the document still
 * has it, and a value is only moved across when the target `headingBlock`
 * slot is still empty — so a document already migrated (legacy fields
 * absent) produces no patches on a later run.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter @blog/studio dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter @blog/studio migrate:dry` — inspect the diff
 *   3. `pnpm --filter @blog/studio migrate:run` — human-gated, mutates `production`
 */
import {
  at,
  defineMigration,
  set,
  setIfMissing,
  unset,
  type NodePatch,
} from 'sanity/migrate';

const PAGE_TAG_INDEX_TYPE = 'page_tagIndex';
const PAGE_TOPIC_INDEX_TYPE = 'page_topicIndex';

export type TLegacyIndexHeadingDoc = {
  heading?: string;
  supportingText?: string;
  headingBlock?: { heading?: string; supportingText?: string };
};

export const buildLegacyIndexHeadingPatches = (
  doc: TLegacyIndexHeadingDoc,
): NodePatch[] => {
  const needsHeadingMove = Boolean(doc.heading) && !doc.headingBlock?.heading;
  const needsSupportingTextMove =
    Boolean(doc.supportingText) && !doc.headingBlock?.supportingText;

  const patches: NodePatch[] = [];

  if (needsHeadingMove || needsSupportingTextMove) {
    patches.push(at('headingBlock', setIfMissing({})));
  }
  if (needsHeadingMove) {
    patches.push(at('headingBlock.heading', set(doc.heading as string)));
  }
  if (needsSupportingTextMove) {
    patches.push(
      at('headingBlock.supportingText', set(doc.supportingText as string)),
    );
  }
  if (doc.heading !== undefined) {
    patches.push(at('heading', unset()));
  }
  if (doc.supportingText !== undefined) {
    patches.push(at('supportingText', unset()));
  }

  return patches;
};

export default defineMigration({
  title:
    'Drop deprecated page_tagIndex/page_topicIndex heading and supportingText, moving orphaned copy into headingBlock first',
  documentTypes: [PAGE_TAG_INDEX_TYPE, PAGE_TOPIC_INDEX_TYPE],
  migrate: {
    document(doc) {
      return buildLegacyIndexHeadingPatches(
        doc as unknown as TLegacyIndexHeadingDoc,
      );
    },
  },
});
