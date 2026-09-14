/**
 * Creates a `shared_link` document for every legacy inline link still held
 * by `settings_navigation.items`, `settings_footer.social`,
 * `module_hero.secondaryAction`, and `module_heroBlog.secondaryAction`, and
 * repoints each call site at it — the studio-side half of the cutover to
 * the shared link library.
 *
 * Anchor: `documentTypes: ['settings_navigation', 'settings_footer',
 * 'module_hero', 'module_heroBlog']`. Every legacy link lives nested inside
 * one of these four document types, so no cross-document lookup is needed
 * — each visited document carries everything this migration reads.
 *
 * Per document:
 *   - `settings_navigation`/`settings_footer`: every array item still typed
 *     `link` (the retired object type) becomes a `linkRef`/`socialLinkRef`
 *     item referencing a newly created `shared_link`, keeping its `_key`.
 *     `settings_footer`'s items also carry the item's `platform` forward
 *     onto the `socialLinkRef` wrapper (the destination's `accessibleLabel`
 *     does not — the new model has no such field).
 *   - `module_hero`: a populated `secondaryAction` (a bare `link`) becomes
 *     a single `SECONDARY`-variant `ctaActionRef` member of the (new)
 *     `actions` field, and `secondaryAction` itself is unset.
 *   - `module_heroBlog`: a populated `secondaryAction` (a retired
 *     `ctaAction`, carrying its own `variant`/`appearance` plus a nested
 *     `link`) becomes a `ctaActionRef` member of `actions` the same way,
 *     carrying that document's own `variant`/`appearance` forward rather
 *     than hardcoding them.
 *
 * `shared_link` ids are derived from the link's own destination and label
 * (`id.ts`), not from the containing document — `module_hero` and
 * `module_heroBlog` both point "Read Latest" at the post index, so they
 * converge on a single seeded `shared_link` instead of two, which is the
 * point of a shared library.
 *
 * Idempotency: every branch is a target-state guard — an array item is
 * only rewritten while its `_type` is still the retired `link`, and a
 * hero's `secondaryAction` is only migrated while `actions` is not yet set
 * (so authored content already on the new field, from an editor who got
 * there before this migration ran, is never clobbered).
 * `createIfNotExists` on each `shared_link` is itself a no-op past the
 * first run.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter @blog/studio dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter @blog/studio migrate:dry` — inspect the diff
 *   3. `pnpm --filter @blog/studio migrate:run` — human-gated, mutates `production`
 *
 * Deploy-ordering constraint: run this against a dataset before deploying
 * Studio/service/web code built against the shared_link library — code
 * that reads `linkRef`/`socialLinkRef`/`ctaActionRef` finds nothing to
 * resolve until these four call sites are repointed.
 */
import {
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
  LINK_TYPE,
} from '@blog/config/constants';
import {
  at,
  createIfNotExists,
  defineMigration,
  patch,
  set,
  unset,
  type Mutation,
  type NodePatch,
} from 'sanity/migrate';

import { toSharedLinkId, type TLinkIdentity } from './id';

const NAVIGATION_TYPE = 'settings_navigation';
const FOOTER_TYPE = 'settings_footer';
const HERO_TYPE = 'module_hero';
const HERO_BLOG_TYPE = 'module_heroBlog';

/** The retired inline `link` object's own `_type`, not to be confused with `LINK_TYPE`'s `linkType` values. */
const LEGACY_LINK_TYPE = 'link';

type TLegacyLinkValue = TLinkIdentity & {
  _key?: string;
  _type?: string;
  internalReference?: { _type: 'reference'; _ref: string };
  openInNewTab?: boolean;
  platform?: string;
};

type TLegacyCtaActionValue = {
  variant?: string;
  appearance?: string;
  link?: TLegacyLinkValue;
};

type TArrayDoc = {
  _id: string;
  _type: string;
  items?: TLegacyLinkValue[];
  social?: TLegacyLinkValue[];
};

type THeroDoc = {
  _id: string;
  _type: string;
  actions?: unknown[];
  secondaryAction?: TLegacyLinkValue;
};

type THeroBlogDoc = {
  _id: string;
  _type: string;
  actions?: unknown[];
  secondaryAction?: TLegacyCtaActionValue;
};

const buildSharedLinkPayload = (id: string, link: TLegacyLinkValue) => ({
  _id: id,
  _type: 'shared_link',
  title: link.label ?? 'Link',
  label: link.label ?? 'Link',
  linkType: link.linkType ?? LINK_TYPE.INTERNAL,
  internalReference: link.internalReference,
  url: link.url,
  openInNewTab: link.openInNewTab ?? false,
});

const migrateLinkArray = (
  doc: TArrayDoc,
  fieldName: 'items' | 'social',
  refType: 'linkRef' | 'socialLinkRef',
): Mutation[] => {
  const source = doc[fieldName];

  if (!source) return [];

  const mutations: Mutation[] = [];
  let changed = false;

  const nextItems = source.map((item) => {
    if (item._type !== LEGACY_LINK_TYPE) return item;

    changed = true;

    const id = toSharedLinkId(doc._id, item);

    mutations.push(createIfNotExists(buildSharedLinkPayload(id, item)));

    return {
      _key: item._key,
      _type: refType,
      ...(refType === 'socialLinkRef' && item.platform
        ? { platform: item.platform }
        : {}),
      link: { _type: 'reference', _ref: id },
    };
  });

  if (!changed) return [];

  mutations.push(patch(doc._id, [at(fieldName, set(nextItems))]));

  return mutations;
};

const migrateHeroSecondaryAction = (doc: THeroDoc): Mutation[] => {
  if (doc.actions !== undefined) return [];

  const secondaryAction = doc.secondaryAction;

  if (!secondaryAction) return [];

  const id = toSharedLinkId(doc._id, secondaryAction);

  const patches: NodePatch[] = [
    at(
      'actions',
      set([
        {
          _key: 'secondaryAction',
          _type: 'ctaActionRef',
          variant: CTA_ACTION_VARIANT.SECONDARY,
          appearance: CTA_ACTION_APPEARANCE.CONTAINED,
          link: { _type: 'reference', _ref: id },
        },
      ]),
    ),
    at('secondaryAction', unset()),
  ];

  return [
    createIfNotExists(buildSharedLinkPayload(id, secondaryAction)),
    patch(doc._id, patches),
  ];
};

const migrateHeroBlogSecondaryAction = (doc: THeroBlogDoc): Mutation[] => {
  if (doc.actions !== undefined) return [];

  const secondaryAction = doc.secondaryAction;
  const link = secondaryAction?.link;

  if (!secondaryAction || !link) return [];

  const id = toSharedLinkId(doc._id, link);

  const patches: NodePatch[] = [
    at(
      'actions',
      set([
        {
          _key: 'secondaryAction',
          _type: 'ctaActionRef',
          variant: secondaryAction.variant ?? CTA_ACTION_VARIANT.SECONDARY,
          appearance:
            secondaryAction.appearance ?? CTA_ACTION_APPEARANCE.CONTAINED,
          link: { _type: 'reference', _ref: id },
        },
      ]),
    ),
    at('secondaryAction', unset()),
  ];

  return [
    createIfNotExists(buildSharedLinkPayload(id, link)),
    patch(doc._id, patches),
  ];
};

export default defineMigration({
  title: 'Seed shared_link documents and repoint the nav/footer/hero links',
  documentTypes: [NAVIGATION_TYPE, FOOTER_TYPE, HERO_TYPE, HERO_BLOG_TYPE],

  migrate: {
    document(rawDoc) {
      if (rawDoc._type === NAVIGATION_TYPE) {
        return migrateLinkArray(
          rawDoc as unknown as TArrayDoc,
          'items',
          'linkRef',
        );
      }

      if (rawDoc._type === FOOTER_TYPE) {
        return migrateLinkArray(
          rawDoc as unknown as TArrayDoc,
          'social',
          'socialLinkRef',
        );
      }

      if (rawDoc._type === HERO_TYPE) {
        return migrateHeroSecondaryAction(rawDoc as unknown as THeroDoc);
      }

      if (rawDoc._type === HERO_BLOG_TYPE) {
        return migrateHeroBlogSecondaryAction(
          rawDoc as unknown as THeroBlogDoc,
        );
      }

      return undefined;
    },
  },
});
