/**
 * Unify `navItem` / `socialLink` / the old `link` document into the single
 * `link` object (schema change: Phase 4, Task 1 — link unification). Run
 * AFTER the schema change + `pnpm typegen`.
 *
 * Transforms:
 *   - `settings_navigation.items`: each `navItem { label, href }` becomes
 *     `link { _type: 'link', label, linkType: 'external', url: href }`.
 *   - `settings_footer.social`: each `socialLink { platform, url }` becomes
 *     `link { _type: 'link', label: platform, linkType: 'external', url,
 *     platform: <normalized> }`, where the normalized platform lowercases the
 *     old free-text value and keeps it only if it matches a known
 *     `SOCIAL_PLATFORMS` value (otherwise `platform` is left unset).
 *   - `author.socialLinks` is intentionally UNTOUCHED — `socialLink` stays a
 *     live schema type for that field (see schema-types/objects/social-link.ts),
 *     out of scope for this migration.
 *
 * `homePage.secondaryAction` — approach taken:
 *   Before the schema change, `secondaryAction` was a `reference` to a `link`
 *   **document**. A plain `document()` node-visitor cannot dereference another
 *   document on its own, but `MigrationContext` (passed to every node-visitor,
 *   see `@sanity/migrate` `types.ts`) exposes `context.client`, a real
 *   `@sanity/client` instance (restricted to `fetch` / `getDocument` /
 *   `getDocuments` / `clone` / `config` / `withConfig`) backed by the live
 *   dataset — not just the migration's own filtered/exported document set.
 *   Node-visitor handlers may also be `async` and return a `Promise` of
 *   mutations. So this migration dereferences `secondaryAction._ref` via
 *   `context.client.getDocument(ref)` and `set()`s an inline `link` object
 *   built from the fetched document's fields, then lets the reference itself
 *   be overwritten by the patch. There is a single `homePage` singleton, so
 *   this is a single, bounded dereference per run.
 *
 * Workflow (see ../README.md for full guardrails):
 *   1. pnpm --filter cms dataset:export -- migrations/backups/production-pre-unify-links.tar.gz
 *   2. pnpm --filter cms migrate:dry -- unify-links
 *   3. Inspect the dry-run diff carefully.
 *   4. Only then: pnpm --filter cms migrate:run -- unify-links
 *      (human-gated — an agent must not run this step)
 */
import {
  SOCIAL_PLATFORMS,
  TLINK_TYPE,
  type TLinkType,
} from '@blog/config/constants';
import { at, defineMigration, set, unset } from 'sanity/migrate';

type TKeyed<T> = T & { _key: string };

type TNavItem = { label?: string; href?: string };
type TSocialLink = { platform?: string; url?: string };

type TLinkReference = { _type: 'reference'; _ref: string; _weak?: boolean };

type TLegacyLinkDocument = {
  _id: string;
  _type: 'link';
  label?: string;
  linkType?: string;
  internalReference?: unknown;
  url?: string;
};

type TLinkObject = {
  _type: 'link';
  _key?: string;
  label?: string;
  linkType?: TLinkType;
  internalReference?: unknown;
  url?: string;
  openInNewTab?: boolean;
  platform?: string;
};

const SOCIAL_PLATFORM_VALUES: readonly string[] =
  Object.values(SOCIAL_PLATFORMS);

/** Uppercases free-text platform names and keeps only known values. */
const normalizePlatform = (
  platform: string | undefined,
): string | undefined => {
  if (!platform) return undefined;
  const normalized = platform.trim().toUpperCase();
  return SOCIAL_PLATFORM_VALUES.includes(normalized) ? normalized : undefined;
};

const navItemToLink = (item: TKeyed<TNavItem>): TKeyed<TLinkObject> => ({
  _key: item._key,
  _type: 'link',
  label: item.label,
  linkType: TLINK_TYPE.EXTERNAL,
  url: item.href,
});

const socialLinkToLink = (item: TKeyed<TSocialLink>): TKeyed<TLinkObject> => ({
  _key: item._key,
  _type: 'link',
  label: item.platform,
  linkType: TLINK_TYPE.EXTERNAL,
  url: item.url,
  platform: normalizePlatform(item.platform),
});

const isReference = (value: unknown): value is TLinkReference =>
  typeof value === 'object' &&
  value !== null &&
  (value as { _type?: unknown })._type === 'reference' &&
  typeof (value as { _ref?: unknown })._ref === 'string';

const legacyLinkDocToInlineLink = (doc: TLegacyLinkDocument): TLinkObject => ({
  _type: 'link',
  label: doc.label,
  linkType:
    doc.linkType === 'internal' ? TLINK_TYPE.INTERNAL : TLINK_TYPE.EXTERNAL,
  internalReference: doc.internalReference,
  url: doc.url,
});

export default defineMigration({
  title: 'Unify navItem/socialLink/link document into shared link object',
  documentTypes: ['settings_navigation', 'settings_footer', 'homePage'],

  migrate: {
    document(doc, context) {
      if (doc._type === 'settings_navigation') {
        const items = (doc as { items?: TKeyed<TNavItem>[] }).items;
        if (!items) return undefined;

        return [at('items', set(items.map(navItemToLink)))];
      }

      if (doc._type === 'settings_footer') {
        const social = (doc as { social?: TKeyed<TSocialLink>[] }).social;
        if (!social) return undefined;

        return [at('social', set(social.map(socialLinkToLink)))];
      }

      if (doc._type === 'homePage') {
        const secondaryAction = (doc as { secondaryAction?: unknown })
          .secondaryAction;

        if (!isReference(secondaryAction)) {
          // Already unset, or already migrated to an inline link object.
          return undefined;
        }

        return context.client
          .getDocument<TLegacyLinkDocument>(secondaryAction._ref)
          .then((linkDoc) => {
            if (!linkDoc) {
              // Dangling reference — clear the field rather than leave a
              // broken reference behind.
              return [at('secondaryAction', unset())];
            }

            return [
              at('secondaryAction', set(legacyLinkDocToInlineLink(linkDoc))),
            ];
          });
      }

      return undefined;
    },
  },
});
