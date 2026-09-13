/**
 * Unsets `settings_site.tagline` — the schema no longer declares it, and
 * nothing in `apps/web`/`apps/platform`/`@blog/service` reads it. Idempotency
 * guard: only unsets when the field is actually present, so an
 * already-migrated doc produces no patch.
 */
import { at, defineMigration, unset } from 'sanity/migrate';

type TSettingsSiteDoc = {
  tagline?: unknown;
};

export const removeStaleTagline = (doc: TSettingsSiteDoc) => {
  if (doc.tagline === undefined) return undefined;

  return [at('tagline', unset())];
};

export default defineMigration({
  title: 'Unset stale settings_site.tagline',
  documentTypes: ['settings_site'],
  migrate: {
    document(doc) {
      return removeStaleTagline(doc as unknown as TSettingsSiteDoc);
    },
  },
});
