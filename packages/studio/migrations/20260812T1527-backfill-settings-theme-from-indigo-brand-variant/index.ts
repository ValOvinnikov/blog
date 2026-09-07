/**
 * Backfills the `settings_theme` singleton from `settings_site.brand.variant`
 * — a field no longer declared in the schema, but still present on older
 * `settings_site` documents. For every `settings_site` document with
 * `brand.variant === 'INDIGO'`, creates/updates `settings_theme` to
 * `INDIGO_THEME_TARGET` — the hue values that reproduced the legacy
 * `.indigo` CSS class. `settings_site` documents with
 * `brand.variant === 'CONSOLE'` (or unset) need no write.
 *
 * The pure transform (`indigoThemeMutations`) lives in `./transform.ts` and
 * is exported so this migration is unit-testable without a live dataset
 * connection — see `./index.test.ts`.
 *
 * Idempotency guard: `indigoThemeMutations` skips once `settings_theme`
 * already matches the target values exactly (see `./transform.ts`) — safe to
 * re-run.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter @blog/studio dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter @blog/studio migrate:dry` — inspect the diff
 *   3. `pnpm --filter @blog/studio migrate:run` — human-gated, mutates `production`
 */
import { defineMigration } from 'sanity/migrate';

import {
  indigoThemeMutations,
  THEME_DOCUMENT_ID,
  type TSiteSettingsDoc,
  type TThemeDoc,
} from './transform';

export default defineMigration({
  title: 'Backfill settings_theme from legacy INDIGO brand.variant',
  documentTypes: ['settings_site'],
  migrate: {
    async document(doc, context) {
      const site = doc as unknown as TSiteSettingsDoc;

      // `indigoThemeMutations` ignores `currentTheme` for every non-INDIGO
      // variant, so skip the `getDocument` round-trip for those documents.
      if (site.brand?.variant !== 'INDIGO') return [];

      // `context.filtered` is scoped to this migration's `documentTypes`
      // (`['settings_site']`), so it can never resolve `settings_theme` — a
      // different `_type`. `context.client` is the live, unrestricted client.
      const currentTheme =
        await context.client.getDocument<TThemeDoc>(THEME_DOCUMENT_ID);

      // A resolved Promise can't carry `undefined` (see `NodeMigration.document`'s
      // return type in `sanity/migrate`) — `[]` is the equivalent no-op mutation list.
      return indigoThemeMutations(site, currentTheme) ?? [];
    },
  },
});
