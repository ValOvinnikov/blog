/**
 * Split `siteSettings` into three documents and fold flat brand fields into
 * a single `brand` object. Run AFTER the schema change (Phase 3, Task 1) +
 * `pnpm typegen`.
 *
 * Transforms (on the singleton `siteSettings` document only):
 *   - `createIfNotExists` a new `settings_navigation` singleton
 *     (`_id: 'settings_navigation'`) seeded from the old `siteSettings.navigation`
 *     array.
 *   - `createIfNotExists` a new `settings_footer` singleton
 *     (`_id: 'settings_footer'`) seeded from the old `siteSettings.socialLinks`
 *     array.
 *   - Patches `siteSettings`: `set`s a new `brand` object built from
 *     `title` / `brandPrefix` / `brandSuffix` / `logo`, then `unset`s those
 *     four fields plus `navigation` and `socialLinks`.
 *
 * API note: the `document()` node-visitor patches only the *visited* document
 * by default (a bare `NodePatch[]` return gets auto-wrapped in
 * `patch(doc._id, ...)`). To also create the two new singletons from the same
 * visit, this migration returns a mixed array containing explicit
 * `createIfNotExists(...)` mutations alongside the `patch(...)` mutation for
 * `siteSettings` itself — `sanity/migrate` passes fully-formed `Mutation`
 * values through untouched (see `@sanity/migrate` `normalizeDocumentMutation`
 * / `isMutation`), so this is a single valid migration run, not a client
 * script glued on top.
 *
 * Workflow (see ../README.md for full guardrails):
 *   1. pnpm --filter cms dataset:export -- migrations/backups/production-pre-split.tar.gz
 *   2. pnpm --filter cms migrate:dry -- split-site-settings
 *   3. Inspect the dry-run diff carefully.
 *   4. Only then: pnpm --filter cms migrate:run -- split-site-settings
 *      (human-gated — an agent must not run this step)
 */
import {
  at,
  createIfNotExists,
  defineMigration,
  patch,
  set,
  unset,
} from 'sanity/migrate';

type TKeyed<T> = T & { _key: string };

type TNavItem = { label?: string; href?: string };
type TSocialLink = { platform?: string; url?: string };
type TImageWithAlt = Record<string, unknown>;

type TLegacySiteSettings = {
  _id: string;
  title?: string;
  brandPrefix?: string;
  brandSuffix?: string;
  logo?: TImageWithAlt;
  navigation?: TKeyed<TNavItem>[];
  socialLinks?: TKeyed<TSocialLink>[];
};

const NAVIGATION_ID = 'settings_navigation';
const FOOTER_ID = 'settings_footer';

export default defineMigration({
  title: 'Split siteSettings into site/navigation/footer + brand',
  documentTypes: ['siteSettings'],

  migrate: {
    document(doc) {
      const settings = doc as unknown as TLegacySiteSettings;

      const hasBrandSource =
        settings.title !== undefined ||
        settings.brandPrefix !== undefined ||
        settings.brandSuffix !== undefined ||
        settings.logo !== undefined;

      const ops = [
        createIfNotExists({
          _id: NAVIGATION_ID,
          _type: NAVIGATION_ID,
          items: settings.navigation ?? [],
        }),
        createIfNotExists({
          _id: FOOTER_ID,
          _type: FOOTER_ID,
          social: settings.socialLinks ?? [],
        }),
      ];

      const patches = [
        ...(hasBrandSource
          ? [
              at(
                'brand',
                set({
                  _type: 'brand',
                  name: settings.title,
                  prefix: settings.brandPrefix,
                  suffix: settings.brandSuffix,
                  logo: settings.logo,
                }),
              ),
            ]
          : []),
        at('title', unset()),
        at('brandPrefix', unset()),
        at('brandSuffix', unset()),
        at('logo', unset()),
        at('navigation', unset()),
        at('socialLinks', unset()),
      ];

      return [...ops, patch(settings._id, patches)];
    },
  },
});
