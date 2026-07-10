/**
 * Unify `navItem` / `socialLink` / the old `link` document into the single
 * `link` object (Phase 4 — link unification). Run AFTER the schema change +
 * `pnpm typegen`.
 *
 * Transforms (per-document, no cross-document dereference):
 *   - `settings_navigation.items`: each `navItem { label, href }` becomes
 *     `link { _type: 'link', label, linkType: 'EXTERNAL', url: href }`.
 *   - `settings_footer.social`: each `socialLink { platform, url }` becomes
 *     `link { _type: 'link', label: platform, linkType: 'EXTERNAL', url,
 *     platform: <normalized> }`, where the normalized platform UPPERCASES the
 *     old free-text value and keeps it only if it matches a known
 *     `SOCIAL_PLATFORMS` value (otherwise `platform` is left unset).
 *   - `author.socialLinks` is intentionally UNTOUCHED — `socialLink` stays a
 *     live schema type for that field, out of scope for this migration.
 *
 * `homePage.secondaryAction` (a reference to a legacy `link` document) must
 * become an inline `link` object, but a migration cannot dereference another
 * document here: `@sanity/migrate`'s `context.client` is a Proxy that throws
 * with the installed `@sanity/client` (private-field access). So the hero action
 * is inlined by the co-located `inline-hero.mjs` script (a real client), run
 * AFTER this migration:
 *   pnpm --filter cms exec sanity exec migrations/unify-links/inline-hero.mjs --with-user-token
 *
 * Workflow (see ../README.md for full guardrails):
 *   1. pnpm --filter cms dataset:export
 *   2. pnpm --filter cms migrate:dry   (tracked; inspect the diff)
 *   3. pnpm --filter cms migrate:run   (human-gated)
 *   4. inline the hero action (human-gated):
 *      pnpm --filter cms exec sanity exec migrations/unify-links/inline-hero.mjs --with-user-token
 */
import {
  SOCIAL_PLATFORMS,
  TLINK_TYPE,
  type TLinkType,
} from '@blog/config/constants';
import { at, defineMigration, set } from 'sanity/migrate';

type TKeyed<T> = T & { _key: string };

type TNavItem = { label?: string; href?: string };
type TSocialLink = { platform?: string; url?: string };

type TLinkObject = {
  _type: 'link';
  _key?: string;
  label?: string;
  linkType?: TLinkType;
  url?: string;
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

export default defineMigration({
  title: 'Unify navItem/socialLink into the shared link object',
  documentTypes: ['settings_navigation', 'settings_footer'],

  migrate: {
    document(doc) {
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

      return undefined;
    },
  },
});
