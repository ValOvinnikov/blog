/**
 * Migrates `module_cta.actions.actions[]` (an `actionGroup` of `ctaAction`s,
 * each embedding an `inlineLink`) to the flat `ctaButtons[]` array, where
 * each `ctaButton` references a standalone `link` document instead of
 * embedding its destination.
 *
 * Per `module_cta` document:
 *   1. For every legacy `ctaAction`, `createIfNotExists` a `link` document
 *      for its destination — deduped by a deterministic id derived from the
 *      destination itself (`../lib/link-identity.ts`), so two actions (in
 *      this document or any other) pointing at the same page/URL collapse
 *      onto one `link`.
 *   2. Build the matching `ctaButton`, preserving `_key`/`variant`/
 *      `appearance` and original array order.
 *   3. `set` the resulting `ctaButtons[]` and `unset` the legacy `actions`
 *      field, in the same patch.
 *
 * `platform` and `accessibleLabel` have no field on `link` and are dropped;
 * a missing/oversized `label`, a dropped `platform`/`accessibleLabel`, and
 * an ordering violation the new schema would reject (more than one Primary
 * or Secondary, or a Primary not listed first) are all reported via
 * `console.warn` rather than silently fixed or fabricated — inspect
 * `migrate:dry`'s output for these before running for real.
 *
 * Idempotency: skips any document that already has `ctaButtons` (the target
 * shape) or lacks the legacy `actions` field (nothing to do); `link`
 * document creation is `createIfNotExists`, so a re-run creates nothing
 * twice.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter @blog/studio dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter @blog/studio migrate:dry` — inspect the diff and warnings
 *   3. `pnpm --filter @blog/studio migrate:run` — human-gated, mutates the dataset
 */
import { LINK_TYPE } from '@blog/config/constants';
import {
  at,
  createIfNotExists,
  defineMigration,
  patch,
  set,
  unset,
  type MigrationContext,
  type Mutation,
} from 'sanity/migrate';

import { buildLinkDocumentFields } from '../lib/build-link-document-fields';
import { toLinkId, toLinkIdentityKey } from '../lib/link-identity';
import { hasMissingLabel, hasOversizedLabel } from '../lib/link-label-checks';
import { LINK_LABEL_MAX_LENGTH } from '../lib/link-label-max-length';

import {
  buildCtaButton,
  detectOrderingIssues,
  type TCtaButtonNode,
  type TLegacyCtaAction,
  type TLegacyInlineLink,
} from './transform';

const MODULE_CTA_TYPE = 'module_cta';

type TLegacyModuleCta = {
  _id: string;
  _type: string;
  actions?: { actions?: TLegacyCtaAction[] };
  ctaButtons?: unknown;
};

const warn = (message: string): void => {
  // eslint-disable-next-line no-console -- migrate:dry/migrate:run have no other channel to surface a migration anomaly to the operator running it
  console.warn(message);
};

export const resolveDestinationTitle = async (
  context: MigrationContext,
  action: TLegacyCtaAction,
): Promise<string> => {
  const link = action.link;

  if (link?.linkType === LINK_TYPE.INTERNAL && link.internalReference?._ref) {
    const target = await context.client.fetch<{ title?: string } | null>(
      '*[_id == $ref][0]{ title }',
      { ref: link.internalReference._ref },
    );

    return `Link to ${target?.title ?? link.internalReference._ref}`;
  }

  return `Link to ${link?.url ?? 'unknown destination'}`;
};

const reportLinkAnomalies = (
  docId: string,
  identityKey: string,
  link: TLegacyInlineLink,
): void => {
  if (hasMissingLabel(link)) {
    warn(
      `${docId}: a ctaAction destined for ${identityKey} has no label — the new link.label is required and was left empty.`,
    );
  } else if (hasOversizedLabel(link)) {
    warn(
      `${docId}: ctaAction label "${link.label}" is ${String(link.label?.length)} characters, over the ${LINK_LABEL_MAX_LENGTH}-character link.label limit — kept as-is.`,
    );
  }

  if (link.platform) {
    warn(
      `${docId}: ctaAction link.platform "${link.platform}" has no field on the link document and was dropped.`,
    );
  }

  if (link.accessibleLabel) {
    warn(
      `${docId}: ctaAction link.accessibleLabel "${link.accessibleLabel}" has no field on the link document and was dropped.`,
    );
  }
};

export default defineMigration({
  title:
    'Migrate module_cta actions.actions[] to ctaButtons[] referencing link documents',
  documentTypes: [MODULE_CTA_TYPE],
  migrate: {
    async document(rawDoc, context) {
      const doc = rawDoc as unknown as TLegacyModuleCta;

      if (doc.ctaButtons !== undefined) return [];
      if (doc.actions === undefined) return [];

      const actions = doc.actions.actions ?? [];
      const orderingIssues = detectOrderingIssues(actions);

      if (orderingIssues.length > 0) {
        warn(
          `${doc._id}: ctaButtons would violate the new ordering rules after migration — ${JSON.stringify(orderingIssues)}. Written in original order; needs a manual fix in Studio.`,
        );
      }

      const mutations: Mutation[] = [];
      const queuedLinkIds = new Set<string>();
      const ctaButtons: TCtaButtonNode[] = [];

      for (const action of actions) {
        const identityKey = action.link
          ? toLinkIdentityKey(action.link)
          : undefined;

        if (!action.link || !identityKey) {
          warn(
            `${doc._id}: skipping a ctaAction with no resolvable destination (neither internalReference nor url set).`,
          );
          continue;
        }

        reportLinkAnomalies(doc._id, identityKey, action.link);

        const linkId = toLinkId(identityKey);

        if (!queuedLinkIds.has(linkId)) {
          queuedLinkIds.add(linkId);

          const title = await resolveDestinationTitle(context, action);

          mutations.push(
            createIfNotExists(
              buildLinkDocumentFields(linkId, title, action.link),
            ),
          );
        }

        ctaButtons.push(buildCtaButton(action, linkId));
      }

      mutations.push(
        patch(doc._id, [
          at('ctaButtons', set(ctaButtons)),
          at('actions', unset()),
        ]),
      );

      return mutations;
    },
  },
});
