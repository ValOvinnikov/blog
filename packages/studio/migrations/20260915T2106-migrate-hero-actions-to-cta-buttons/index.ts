/**
 * Migrates `module_heroStatement.actions` (an `actionGroup`) and
 * `module_heroBlog.secondaryAction` (a lone `ctaAction`) — plus
 * `module_heroBlog`'s own inherited `actions` group, if still present — onto
 * the flat `ctaButtons[]` array, referencing a standalone `link` document
 * per distinct destination instead of embedding it inline. `module_hero` is
 * untouched; it is a separate, deprecated document type.
 *
 * Precedence when a `module_heroBlog` document carries both a
 * `secondaryAction` and an inherited `actions` group: `secondaryAction`
 * wins — it is the module's dedicated, validated secondary slot, and
 * heroBlog's new `ctaButtons` only ever allows one Secondary button, so
 * there is no room to carry both. The `actions` group's content is reported
 * via `console.warn`, never silently dropped without a trace.
 *
 * Accepts a nested link of `_type` `link` or `inlineLink` — the rename
 * migration may not have run yet on every target dataset — and reports
 * anything matching neither rather than guessing at its shape.
 *
 * Idempotency: skips any document that already has `ctaButtons` (the target
 * shape); `link` document creation is `createIfNotExists`, so a re-run
 * creates nothing twice.
 */
import {
  CTA_ACTION_VARIANT,
  LINK_TYPE,
  type TCtaActionVariant,
} from '@blog/config/constants';
import {
  at,
  createIfNotExists,
  defineMigration,
  patch,
  set,
  unset,
  type MigrationContext,
  type Mutation,
  type NodePatch,
} from 'sanity/migrate';

import { toLinkId, toLinkIdentityKey } from './id';
import {
  buildCtaButton,
  buildLinkDocumentFields,
  detectOrderingIssues,
  hasMissingLabel,
  hasOversizedLabel,
  hasRecognizedLinkShape,
  LINK_LABEL_MAX_LENGTH,
  type TCtaButtonNode,
  type TLegacyCtaAction,
  type TLegacyInlineLink,
} from './transform';

const MODULE_HERO_BLOG_TYPE = 'module_heroBlog';
const MODULE_HERO_STATEMENT_TYPE = 'module_heroStatement';

const HERO_STATEMENT_CTA_BUTTONS_MAX = 2;
const HERO_BLOG_CTA_BUTTONS_MAX = 1;
const HERO_BLOG_ALLOWED_VARIANT: TCtaActionVariant =
  CTA_ACTION_VARIANT.SECONDARY;

type TLegacyHeroDoc = {
  _id: string;
  _type: string;
  actions?: { actions?: TLegacyCtaAction[] };
  secondaryAction?: TLegacyCtaAction;
  ctaButtons?: unknown;
};

const warn = (message: string): void => {
  // eslint-disable-next-line no-console -- migrate:dry/migrate:run have no other channel to surface a migration anomaly to the operator running it
  console.warn(message);
};

export const resolveDestinationTitle = async (
  context: MigrationContext,
  link: TLegacyInlineLink,
): Promise<string> => {
  if (link.linkType === LINK_TYPE.INTERNAL && link.internalReference?._ref) {
    const target = await context.client.fetch<{ title?: string } | null>(
      '*[_id == $ref][0]{ title }',
      { ref: link.internalReference._ref },
    );

    return `Link to ${target?.title ?? link.internalReference._ref}`;
  }

  return `Link to ${link.url ?? 'unknown destination'}`;
};

const reportLinkAnomalies = (
  docId: string,
  identityKey: string,
  link: TLegacyInlineLink,
): void => {
  if (hasMissingLabel(link)) {
    warn(
      `${docId}: an action destined for ${identityKey} has no label — the new link.label is required and was left empty.`,
    );
  } else if (hasOversizedLabel(link)) {
    warn(
      `${docId}: action label "${link.label}" is ${String(link.label?.length)} characters, over the ${LINK_LABEL_MAX_LENGTH}-character link.label limit — kept as-is.`,
    );
  }

  if (link.platform) {
    warn(
      `${docId}: action link.platform "${link.platform}" has no field on the link document and was dropped.`,
    );
  }

  if (link.accessibleLabel) {
    warn(
      `${docId}: action link.accessibleLabel "${link.accessibleLabel}" has no field on the link document and was dropped.`,
    );
  }
};

const resolveButtonForAction = async (
  docId: string,
  action: TLegacyCtaAction,
  context: MigrationContext,
  queuedLinkIds: Set<string>,
  mutations: Mutation[],
): Promise<TCtaButtonNode | undefined> => {
  const link = action.link;

  if (!link) {
    warn(`${docId}: skipping an action with no link set.`);
    return undefined;
  }

  if (!hasRecognizedLinkShape(link)) {
    warn(
      `${docId}: an action's link has _type "${String(link._type)}", neither "link" nor "inlineLink" — skipped rather than guessed at.`,
    );
    return undefined;
  }

  const identityKey = toLinkIdentityKey(link);

  if (!identityKey) {
    warn(
      `${docId}: skipping an action with no resolvable destination (neither internalReference nor url set).`,
    );
    return undefined;
  }

  reportLinkAnomalies(docId, identityKey, link);

  const linkId = toLinkId(identityKey);

  if (!queuedLinkIds.has(linkId)) {
    queuedLinkIds.add(linkId);

    const title = await resolveDestinationTitle(context, link);

    mutations.push(
      createIfNotExists(buildLinkDocumentFields(linkId, title, link)),
    );
  }

  return buildCtaButton(action, linkId);
};

const migrateHeroStatement = async (
  doc: TLegacyHeroDoc,
  context: MigrationContext,
): Promise<Mutation[]> => {
  if (doc.ctaButtons !== undefined) return [];
  if (doc.actions === undefined) return [];

  const actions = doc.actions.actions ?? [];
  const orderingIssues = detectOrderingIssues(
    actions,
    HERO_STATEMENT_CTA_BUTTONS_MAX,
  );

  if (orderingIssues.length > 0) {
    warn(
      `${doc._id}: ctaButtons would violate the new ordering rules after migration — ${JSON.stringify(orderingIssues)}. Written in original order; needs a manual fix in Studio.`,
    );
  }

  const mutations: Mutation[] = [];
  const queuedLinkIds = new Set<string>();
  const ctaButtons: TCtaButtonNode[] = [];

  for (const action of actions) {
    const button = await resolveButtonForAction(
      doc._id,
      action,
      context,
      queuedLinkIds,
      mutations,
    );

    if (button) ctaButtons.push(button);
  }

  mutations.push(
    patch(doc._id, [at('ctaButtons', set(ctaButtons)), at('actions', unset())]),
  );

  return mutations;
};

const migrateHeroBlog = async (
  doc: TLegacyHeroDoc,
  context: MigrationContext,
): Promise<Mutation[]> => {
  if (doc.ctaButtons !== undefined) return [];

  const hasActionsGroup = doc.actions !== undefined;
  const hasSecondaryAction = doc.secondaryAction !== undefined;

  if (!hasActionsGroup && !hasSecondaryAction) return [];

  const groupActions = doc.actions?.actions ?? [];
  let sourceAction: TLegacyCtaAction | undefined;

  if (hasSecondaryAction) {
    sourceAction = doc.secondaryAction;

    if (groupActions.length > 0) {
      warn(
        `${doc._id}: has both a legacy secondaryAction and an inherited actions group (${String(groupActions.length)} action(s)) — secondaryAction takes precedence because heroBlog's ctaButtons allows only one Secondary button; the actions group's content was left un-migrated and dropped from this document. Review manually if it held data secondaryAction does not.`,
      );
    }
  } else {
    const secondaryFromGroup = groupActions.find(
      (action) => action.variant === CTA_ACTION_VARIANT.SECONDARY,
    );

    sourceAction = secondaryFromGroup ?? groupActions[0];

    if (groupActions.length > HERO_BLOG_CTA_BUTTONS_MAX) {
      warn(
        `${doc._id}: the inherited actions group has ${String(groupActions.length)} actions, but heroBlog's ctaButtons allows only one — kept "${String(sourceAction?._key)}" (variant ${String(sourceAction?.variant)}), the rest were dropped.`,
      );
    }
  }

  if (sourceAction && sourceAction.variant !== HERO_BLOG_ALLOWED_VARIANT) {
    warn(
      `${doc._id}: the migrated button carries variant ${String(sourceAction.variant)}, but heroBlog's ctaButtons only allows Secondary — written as-is, needs a manual fix in Studio.`,
    );
  }

  const mutations: Mutation[] = [];
  const queuedLinkIds = new Set<string>();
  const ctaButtons: TCtaButtonNode[] = [];

  if (sourceAction) {
    const button = await resolveButtonForAction(
      doc._id,
      sourceAction,
      context,
      queuedLinkIds,
      mutations,
    );

    if (button) ctaButtons.push(button);
  }

  const patches: NodePatch[] = [at('ctaButtons', set(ctaButtons))];

  if (hasActionsGroup) patches.push(at('actions', unset()));
  if (hasSecondaryAction) patches.push(at('secondaryAction', unset()));

  mutations.push(patch(doc._id, patches));

  return mutations;
};

export default defineMigration({
  title:
    'Migrate hero module actions to ctaButtons[] referencing link documents',
  documentTypes: [MODULE_HERO_BLOG_TYPE, MODULE_HERO_STATEMENT_TYPE],
  migrate: {
    async document(rawDoc, context) {
      const doc = rawDoc as unknown as TLegacyHeroDoc;

      if (doc._type === MODULE_HERO_STATEMENT_TYPE) {
        return migrateHeroStatement(doc, context);
      }

      if (doc._type === MODULE_HERO_BLOG_TYPE) {
        return migrateHeroBlog(doc, context);
      }

      return [];
    },
  },
});
