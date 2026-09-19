/**
 * Migrates `settings_navigation.items[]` and `settings_footer.social[]`
 * legacy link entries onto `linkRef`/`socialProfile` references to
 * standalone `link` documents.
 *
 * When any entry in a document is unmigratable, the whole document is left
 * untouched — the array is rebuilt wholesale via `set(...)`, so dropping just
 * the bad entry would delete live content instead of deferring it.
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

import { buildLinkDocumentFields } from '../lib/build-link-document-fields';
import { toLinkId, toLinkIdentityKey } from '../lib/link-identity';
import { LINK_LABEL_MAX_LENGTH } from '../lib/link-label-max-length';

import {
  buildLinkRef,
  buildSocialProfile,
  hasMissingLabel,
  hasOversizedLabel,
  hasRecognizedLinkShape,
  hasResolvableUrl,
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

const UNTOUCHED_SUFFIX =
  'The document was left untouched — fix this entry in Studio, then re-run the migration.';

const findFatalIssue = (
  items: TLegacyLinkEntry[],
  targetType: string,
): string | undefined => {
  for (const item of items) {
    if (isAlreadyMigrated(item, targetType)) continue;

    if (!hasRecognizedLinkShape(item)) {
      return `a link entry (key "${item._key}") has _type "${String(item._type)}", neither "link" nor "inlineLink"`;
    }

    if (!toLinkIdentityKey(item)) {
      return `a link entry (key "${item._key}") has no resolvable destination (neither internalReference nor url set)`;
    }

    if (!hasResolvableUrl(item)) {
      return `a link entry (key "${item._key}")'s url "${String(item.url)}" is not a full http(s) address with a host — the new link.url requires one`;
    }
  }

  return undefined;
};

const warnDocumentSkipped = (docId: string, issue: string): void => {
  warn(`${docId}: ${issue}. ${UNTOUCHED_SUFFIX}`);
};

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

/** Assumes `findFatalIssue` has already cleared every entry in the document. */
const resolveLinkIdForItem = async (
  docId: string,
  item: TLegacyLinkEntry,
  context: MigrationContext,
  queuedLinkIds: Set<string>,
  mutations: Mutation[],
): Promise<string> => {
  const identityKey = toLinkIdentityKey(item);

  if (!identityKey) {
    throw new Error(
      `${docId}: a link entry passed the pre-migration validation scan but has no resolvable destination.`,
    );
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

  const fatalIssue = findFatalIssue(items, LINK_REF_TYPE);

  if (fatalIssue) {
    warnDocumentSkipped(doc._id, fatalIssue);
    return [];
  }

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

  const fatalIssue = findFatalIssue(social, SOCIAL_PROFILE_TYPE);

  if (fatalIssue) {
    warnDocumentSkipped(doc._id, fatalIssue);
    return [];
  }

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
