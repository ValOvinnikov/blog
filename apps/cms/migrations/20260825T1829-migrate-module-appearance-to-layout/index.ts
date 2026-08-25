/**
 * Migrates `module_hero`/`module_newsletter`'s legacy `appearance` object
 * onto the current `layout`/`heroLayout` field
 * (`20260811T1959-restructure-module-heading-fields-to-section-header` moved
 * everything else off the old flat shape, but this rename never got its own
 * migration) — `appearance` still holds the real authored spacing/divider/
 * width values on any doc where `layout` was never filled in.
 *
 *   - `spacingTop`/`spacingBottom` -> same-named `layout`/`heroLayout` fields.
 *   - `containerWidth` -> `layout.containerWidth` (`module_newsletter` only;
 *     `heroLayoutSchema` has no such field for `module_hero`).
 *   - `divider` (single boolean) -> both `dividerTop` and `dividerBottom`.
 *   - `align` is dropped, not migrated — confirmed dead: no downstream
 *     reader in `packages/service`/`packages/ui`/`apps/web`, and its old
 *     START/END vocabulary doesn't match the `HEADING_ALIGN` enum used
 *     elsewhere.
 *   - `appearance` is unset once the copy is done.
 *
 * The pure value transform lives in `./transform.ts` (`appearanceToLayout`);
 * `migrateModuleAppearanceToLayout` below composes it with the idempotency
 * guard and is what `document()` delegates to. Exported so this migration is
 * unit-testable without a live dataset connection — see `./index.test.ts`.
 *
 * Idempotency guard (symmetric across both document types): skips a doc
 * whose `layout` is already defined — the *target* shape, not the presence
 * of `appearance` — so a doc that transiently carries both is never
 * re-wrapped or clobbered. `layout` is written with `setIfMissing`, and only
 * when it would carry at least one field; `appearance` is unset whenever it
 * was present, even if that leaves nothing worth copying onto `layout`.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter cms dataset:export -- migrations/backups/<dataset>-<date>.tar.gz`
 *   2. `pnpm --filter cms migrate:dry` — inspect the diff
 *   3. `pnpm --filter cms migrate:run` — human-gated, mutates the target dataset
 *
 * Deploy-ordering constraint: run this against a dataset *before* deploying
 * service/web code that reads `layout`/`heroLayout` instead of the legacy
 * `appearance`, so there is no window where a live document has neither
 * shape populated for the code currently reading it.
 */
import { at, defineMigration, setIfMissing, unset } from 'sanity/migrate';

import { appearanceToLayout, type TLegacyAppearanceDoc } from './transform';

export const migrateModuleAppearanceToLayout = (
  type: string,
  doc: TLegacyAppearanceDoc,
) => {
  const layout = appearanceToLayout(doc, {
    includeContainerWidth: type === 'module_newsletter',
  });
  if (layout === undefined) return undefined;

  return [
    ...(Object.keys(layout).length > 0
      ? [at('layout', setIfMissing(layout))]
      : []),
    at('appearance', unset()),
  ];
};

export default defineMigration({
  title: 'Migrate module_hero/module_newsletter appearance to layout',
  documentTypes: ['module_hero', 'module_newsletter'],
  migrate: {
    document(doc) {
      return migrateModuleAppearanceToLayout(
        doc._type,
        doc as unknown as TLegacyAppearanceDoc,
      );
    },
  },
});
