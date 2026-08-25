/**
 * Renames the legacy `'POST_CATEGORY'` value of `module_hero.heroEyebrowMode`
 * to `HERO_FIELD_MODE.POST_TOPIC`. A document still carrying the old value
 * offers no matching radio option in the Studio (risking a silent clobber on
 * next save) and violates the regenerated TypeScript union.
 *
 * Idempotency guard: only a document whose `heroEyebrowMode` is exactly the
 * legacy string is patched — any other value, including an already-migrated
 * `'POST_TOPIC'`, is left untouched.
 */
import { HERO_FIELD_MODE } from '@blog/config/constants';
import { at, defineMigration, set } from 'sanity/migrate';

type THeroDoc = {
  heroEyebrowMode?: string;
};

const LEGACY_POST_CATEGORY_MODE = 'POST_CATEGORY';

export const renameHeroEyebrowPostCategoryMode = (doc: THeroDoc) => {
  if (doc.heroEyebrowMode !== LEGACY_POST_CATEGORY_MODE) return undefined;

  return [at('heroEyebrowMode', set(HERO_FIELD_MODE.POST_TOPIC))];
};

export default defineMigration({
  title: 'Rename module_hero.heroEyebrowMode POST_CATEGORY to POST_TOPIC',
  documentTypes: ['module_hero'],
  migrate: {
    document(doc) {
      return renameHeroEyebrowPostCategoryMode(doc as unknown as THeroDoc);
    },
  },
});
