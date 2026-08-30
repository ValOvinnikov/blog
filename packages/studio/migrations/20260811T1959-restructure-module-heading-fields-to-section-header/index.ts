/**
 * Restructures `module_cta`/`module_newsletter`/`module_postList`'s legacy
 * heading fields into the new nested `sectionHeader` object (#1372, part of
 * the Layout & SectionHeader redesign, #1370):
 *
 *   - `module_cta`: `heading` (required) + `text` -> `sectionHeader.heading`
 *     + `sectionHeader.supportingText`; both legacy fields are unset.
 *   - `module_newsletter`: `heading` (required) + `description` -> the same
 *     `sectionHeader.heading`/`supportingText`; both legacy fields are unset.
 *   - `module_postList`: `title` (its former dual-purpose display heading) is
 *     *copied* onto `sectionHeader.heading` — `title` is not unset, since it
 *     remains a purely internal Studio label going forward, independent of
 *     the new public-facing `sectionHeader.heading`.
 *
 * The pure value transforms live in `./transform.ts`
 * (`headingFieldsToSectionHeader`, `postListTitleToSectionHeader`); the
 * document-level patch builders below compose them with the idempotency
 * guard and are what `document()` delegates to. Both are exported so this
 * migration is unit-testable without a live dataset connection — see
 * `./index.test.ts` and `./transform.test.ts`.
 *
 * Idempotency guards (symmetric across all three document types):
 *   - A doc with `sectionHeader` already set is already migrated — no-op,
 *     regardless of whether the legacy fields are still present, so a doc
 *     that transiently carries both shapes is never re-wrapped or clobbered.
 *   - `sectionHeader` is written with `setIfMissing`, never `set`.
 *   - `module_cta`/`module_newsletter`'s legacy fields are only unset when
 *     they were actually present on the doc.
 *   - `heading` was `.required()` on both `module_cta`/`module_newsletter`
 *     pre-migration, so it should never be empty in practice — but if a doc
 *     somehow has neither `heading` nor `text`/`description`, this migration
 *     leaves it alone entirely (no `sectionHeader` write, no unsets),
 *     producing a doc that still needs its now-required
 *     `sectionHeader.heading` filled in manually. Same reasoning applies to
 *     `module_postList`'s `title`, though it too was always `.required()`.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter @blog/studio dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter @blog/studio migrate:dry` — inspect the diff
 *   3. `pnpm --filter @blog/studio migrate:run` — human-gated, mutates `production`
 *
 * Deploy-ordering constraint: run this against `production` *before*
 * deploying service/web code that reads `sectionHeader` instead of the
 * legacy `heading`/`text`/`description`/dual-purpose `title` fields, so
 * there is no window where live documents have neither shape populated for
 * the code currently reading them.
 */
import { at, defineMigration, setIfMissing, unset } from 'sanity/migrate';

import {
  headingFieldsToSectionHeader,
  postListTitleToSectionHeader,
  type TLegacyHeadingSourceDoc,
  type TLegacyPostListDoc,
} from './transform';

export const moveHeadingFieldsToSectionHeader = (
  doc: TLegacyHeadingSourceDoc,
) => {
  const sectionHeader = headingFieldsToSectionHeader(doc);
  if (!sectionHeader) return undefined;

  return [
    at('sectionHeader', setIfMissing(sectionHeader)),
    ...(doc.heading !== undefined ? [at('heading', unset())] : []),
    ...(doc.text !== undefined ? [at('text', unset())] : []),
    ...(doc.description !== undefined ? [at('description', unset())] : []),
  ];
};

export const movePostListTitleToSectionHeader = (doc: TLegacyPostListDoc) => {
  const sectionHeader = postListTitleToSectionHeader(doc);
  if (!sectionHeader) return undefined;

  return [at('sectionHeader', setIfMissing(sectionHeader))];
};

export default defineMigration({
  title:
    'Restructure module_cta/module_newsletter/module_postList heading fields into sectionHeader',
  documentTypes: ['module_cta', 'module_newsletter', 'module_postList'],
  migrate: {
    document(doc) {
      if (doc._type === 'module_postList') {
        return movePostListTitleToSectionHeader(
          doc as unknown as TLegacyPostListDoc,
        );
      }
      return moveHeadingFieldsToSectionHeader(
        doc as unknown as TLegacyHeadingSourceDoc,
      );
    },
  },
});
