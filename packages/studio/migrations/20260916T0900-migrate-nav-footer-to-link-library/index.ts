/**
 * Migrates `settings_navigation.items[]` and `settings_footer.social[]`
 * entries — each currently a legacy `link`/`inlineLink` object embedding its
 * destination — onto `linkRef` (navigation) and `socialProfile` (footer),
 * each pointing at a standalone `link` document instead.
 *
 * Per entry: `createIfNotExists` a `link` document for its destination,
 * deduped by a deterministic id derived from the destination *and* label
 * (`id.ts`) — a `link` document has one required `label`, so two entries
 * with different visible wording stay distinct even at the same
 * destination. `settings_footer`'s `accessibleLabel` is dropped: the
 * footer's accessible name is now derived from `platform`, not stored on
 * the link. `platform` itself stays on the `socialProfile` wrapper, not the
 * `link` document.
 *
 * Accepts a nested item of `_type` `link` or `inlineLink` — the rename
 * migration may not have run yet on every target dataset — and reports
 * anything matching neither, or an unresolvable url/destination, via
 * `console.warn` rather than guessing.
 *
 * Idempotency: an entry already at its target `_type` (`linkRef`/
 * `socialProfile`) is passed through unchanged; a document with no legacy
 * entries left in the array is skipped entirely; `link` document creation is
 * `createIfNotExists`, so a re-run creates nothing twice.
 */
import { LINK_TYPE } from '@blog/config/constants';
import {
  at,
  createIfNotExists,
  defineMigration,
  patch,
  set,
  type MigrationContext,
  type Mutation,
} from 'sanity/migrate';

import { toLinkId, toLinkIdentityKey } from './id';
import {
  buildLinkDocumentFields,
  buildLinkRef,
  buildSocialProfile,
  hasMissingLabel,
  hasOversizedLabel,
  hasRecognizedLinkShape,
  hasResolvableUrl,
  LINK_LABEL_MAX_LENGTH,
  LINK_REF_TYPE,
  SOCIAL_PROFILE_TYPE,
  type TLegacyLinkEntry,
  type TLinkRefNode,
  type TSocialProfileNode,
} from './transform';

const NAVIGATION_TYPE = 'settings_navigation';
const FOOTER_TYPE = 'settings_footer';

type TLegacyNavigationDoc = {
  _id: string;
  _type: string;
  items?: TLegacyLinkEntry[];
};

type TLegacyFooterDoc = {
  _id: string;
  _type: string;
  social?: TLegacyLinkEntry[];
};

const warn = (message: string): void => {
  // eslint-disable-next-line no-console -- migrate:dry/migrate:run have no other channel to surface a migration anomaly to the operator running it
  console.warn(message);
};

const isAlreadyMigrated = (
  item: TLegacyLinkEntry,
  targetType: string,
): boolean => item._type === targetType;

export const resolveDestinationTitle = async (
  context: MigrationContext,
  item: TLegacyLinkEntry,
): Promise<string> => {
  if (item.linkType === LINK_TYPE.INTERNAL && item.internalReference?._ref) {
    const target = await context.client.fetch<{ title?: string } | null>(
      '*[_id == $ref][0]{ title }',
      { ref: item.internalReference._ref },
    );

    return `Link to ${target?.title ?? item.internalReference._ref}`;
  }

  return `Link to ${item.url ?? 'unknown destination'}`;
};

const reportLinkAnomalies = (
  docId: string,
  identityKey: string,
  item: TLegacyLinkEntry,
): void => {
  if (hasMissingLabel(item)) {
    warn(
      `${docId}: a link entry destined for ${identityKey} has no label — the new link.label is required and was left empty.`,
    );
  } else if (hasOversizedLabel(item)) {
    warn(
      `${docId}: link entry label "${item.label}" is ${String(item.label?.length)} characters, over the ${LINK_LABEL_MAX_LENGTH}-character link.label limit — kept as-is.`,
    );
  }

  if (item.accessibleLabel) {
    warn(
      `${docId}: link entry accessibleLabel "${item.accessibleLabel}" has no field on the link document and was dropped.`,
    );
  }
};

const resolveLinkIdForItem = async (
  docId: string,
  item: TLegacyLinkEntry,
  context: MigrationContext,
  queuedLinkIds: Set<string>,
  mutations: Mutation[],
): Promise<string | undefined> => {
  if (!hasRecognizedLinkShape(item)) {
    warn(
      `${docId}: a link entry has _type "${String(item._type)}", neither "link" nor "inlineLink" — skipped rather than guessed at.`,
    );
    return undefined;
  }

  const identityKey = toLinkIdentityKey(item);

  if (!identityKey) {
    warn(
      `${docId}: skipping a link entry with no resolvable destination (neither internalReference nor url set).`,
    );
    return undefined;
  }

  if (!hasResolvableUrl(item)) {
    warn(
      `${docId}: a link entry's url "${String(item.url)}" is not a full http(s) address with a host — the new link.url requires one, so this entry was left un-migrated. Fix it manually in Studio.`,
    );
    return undefined;
  }

  reportLinkAnomalies(docId, identityKey, item);

  const linkId = toLinkId(identityKey);

  if (!queuedLinkIds.has(linkId)) {
    queuedLinkIds.add(linkId);

    const title = await resolveDestinationTitle(context, item);

    mutations.push(
      createIfNotExists(buildLinkDocumentFields(linkId, title, item)),
    );
  }

  return linkId;
};

const migrateNavigation = async (
  doc: TLegacyNavigationDoc,
  context: MigrationContext,
): Promise<Mutation[]> => {
  const items = doc.items ?? [];
  const hasLegacyItem = items.some(
    (item) => !isAlreadyMigrated(item, LINK_REF_TYPE),
  );

  if (items.length === 0 || !hasLegacyItem) return [];

  const mutations: Mutation[] = [];
  const queuedLinkIds = new Set<string>();
  const nextItems: (TLinkRefNode | TLegacyLinkEntry)[] = [];

  for (const item of items) {
    if (isAlreadyMigrated(item, LINK_REF_TYPE)) {
      nextItems.push(item);
      continue;
    }

    const linkId = await resolveLinkIdForItem(
      doc._id,
      item,
      context,
      queuedLinkIds,
      mutations,
    );

    if (!linkId) continue;

    nextItems.push(buildLinkRef(item, linkId));
  }

  mutations.push(patch(doc._id, [at('items', set(nextItems))]));

  return mutations;
};

const migrateFooter = async (
  doc: TLegacyFooterDoc,
  context: MigrationContext,
): Promise<Mutation[]> => {
  const social = doc.social ?? [];
  const hasLegacyItem = social.some(
    (item) => !isAlreadyMigrated(item, SOCIAL_PROFILE_TYPE),
  );

  if (social.length === 0 || !hasLegacyItem) return [];

  const mutations: Mutation[] = [];
  const queuedLinkIds = new Set<string>();
  const nextSocial: (TSocialProfileNode | TLegacyLinkEntry)[] = [];

  for (const item of social) {
    if (isAlreadyMigrated(item, SOCIAL_PROFILE_TYPE)) {
      nextSocial.push(item);
      continue;
    }

    if (!item.platform) {
      warn(
        `${doc._id}: a social link entry has no platform set — the new socialProfile.platform is required and was left empty.`,
      );
    }

    const linkId = await resolveLinkIdForItem(
      doc._id,
      item,
      context,
      queuedLinkIds,
      mutations,
    );

    if (!linkId) continue;

    nextSocial.push(buildSocialProfile(item, linkId));
  }

  mutations.push(patch(doc._id, [at('social', set(nextSocial))]));

  return mutations;
};

export default defineMigration({
  title:
    'Migrate settings_navigation.items and settings_footer.social to the link library',
  documentTypes: [NAVIGATION_TYPE, FOOTER_TYPE],
  migrate: {
    async document(rawDoc, context) {
      if (rawDoc._type === NAVIGATION_TYPE) {
        return migrateNavigation(
          rawDoc as unknown as TLegacyNavigationDoc,
          context,
        );
      }

      if (rawDoc._type === FOOTER_TYPE) {
        return migrateFooter(rawDoc as unknown as TLegacyFooterDoc, context);
      }

      return [];
    },
  },
});
