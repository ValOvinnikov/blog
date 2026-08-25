/**
 * Migrates `module_hero`/`module_newsletter`'s legacy `appearance` object
 * onto the current `layout` field (both types store it under that name,
 * only the registered object type differs — `heroLayout` vs `layout`);
 * field mapping lives in `./transform.ts`. Idempotency guard skips a doc
 * whose `layout` is already set (including an explicit `null`) — the
 * *target* shape, not the presence of `appearance` — so a doc that
 * transiently carries both is never re-wrapped or clobbered.
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
