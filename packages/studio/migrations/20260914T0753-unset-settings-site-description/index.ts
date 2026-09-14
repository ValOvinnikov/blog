/**
 * Unsets `settings_site.description` — the schema no longer declares it, and
 * nothing in `apps/web`/`apps/platform`/`@blog/service` reads it. Idempotency
 * guard: only unsets when the field is actually present, so an
 * already-migrated doc produces no patch.
 */
import { at, defineMigration, unset } from 'sanity/migrate';

type TSettingsSiteDoc = {
  description?: unknown;
};

export const removeStaleDescription = (doc: TSettingsSiteDoc) => {
  if (doc.description === undefined) return undefined;

  return [at('description', unset())];
};

export default defineMigration({
  title: 'Unset stale settings_site.description',
  documentTypes: ['settings_site'],
  migrate: {
    document(doc) {
      return removeStaleDescription(doc as unknown as TSettingsSiteDoc);
    },
  },
});
