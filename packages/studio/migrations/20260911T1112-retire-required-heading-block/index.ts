/**
 * Retires the `requiredHeadingBlock` object type into the single shared
 * `headingBlock` type, now that requiredness lives on the field rather than
 * the type:
 *
 *   - `page_post`, `module_cta`, `module_newsletter`: every type that used
 *     to carry `headingBlockField({ requireHeading: true })` — rewrites
 *     `headingBlock._type` from `requiredHeadingBlock` to `headingBlock` —
 *     the field itself is untouched, only the nested type discriminator
 *     changes. Keyed off the document's `headingBlock._type`, not off a
 *     fixed list of `_type`s, so a future type adopting a required heading
 *     block needs no change here beyond joining `DOCUMENT_TYPES`.
 *   - `module_heroStatement`: moves the legacy flat `heading` /
 *     `supportingText` fields onto the same `headingBlock` object, then
 *     unsets both legacy fields.
 *
 * Idempotency guards, independent per branch:
 *   - The `_type` rename: only rewrites when `headingBlock._type` is
 *     exactly `requiredHeadingBlock` — a document already on `headingBlock`,
 *     or with no `headingBlock` at all, is left alone.
 *   - `module_heroStatement`: only builds `headingBlock` when the *target*
 *     field is unset and the *source* `heading` is present — a document
 *     carrying both shapes is never re-wrapped or clobbered.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter @blog/studio dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter @blog/studio migrate:dry` — inspect the diff
 *   3. `pnpm --filter @blog/studio migrate:run` — human-gated, mutates `production`
 *
 * Deploy-ordering constraint: run this against a dataset before deploying
 * service/web code that expects a single `headingBlock` type rather than
 * branching on `requiredHeadingBlock`.
 */
import { at, defineMigration, set, unset } from 'sanity/migrate';

type TRequiredHeadingBlockDoc = {
  headingBlock?: { _type?: string };
};

export const renameRequiredHeadingBlockType = (
  doc: TRequiredHeadingBlockDoc,
) => {
  if (doc.headingBlock?._type !== 'requiredHeadingBlock') return undefined;

  return [at('headingBlock._type', set('headingBlock'))];
};

type THeroStatementDoc = {
  heading?: string;
  supportingText?: string;
  headingBlock?: unknown;
};

const buildHeadingBlockValue = (
  doc: THeroStatementDoc,
): Record<string, unknown> => ({
  _type: 'headingBlock',
  heading: doc.heading,
  ...(doc.supportingText !== undefined
    ? { supportingText: doc.supportingText }
    : {}),
});

export const moveHeroStatementHeadingFields = (doc: THeroStatementDoc) => {
  if (doc.headingBlock !== undefined) return undefined;
  if (doc.heading === undefined) return undefined;

  return [
    at('headingBlock', set(buildHeadingBlockValue(doc))),
    at('heading', unset()),
    ...(doc.supportingText !== undefined
      ? [at('supportingText', unset())]
      : []),
  ];
};

const DOCUMENT_TYPES = [
  'page_post',
  'module_cta',
  'module_newsletter',
  'module_heroStatement',
];

export default defineMigration({
  title: 'Retire requiredHeadingBlock into the single headingBlock type',
  documentTypes: DOCUMENT_TYPES,
  migrate: {
    document(doc) {
      if (doc._type === 'module_heroStatement') {
        return moveHeroStatementHeadingFields(
          doc as unknown as THeroStatementDoc,
        );
      }

      return renameRequiredHeadingBlockType(
        doc as unknown as TRequiredHeadingBlockDoc,
      );
    },
  },
});
