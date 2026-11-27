import {
  LOCALE_ISO_CODES,
  SANITY_DOCUMENT_ACTION,
} from '@shinefold/config/constants';
import { createPreviewAction } from '@shinefold/studio/document-actions/preview-action/preview-action';
import { SendTestAction } from '@shinefold/studio/document-actions/send-test-action/send-test-action';
import { withLandingRedirects } from '@shinefold/studio/document-actions/with-landing-redirects/with-landing-redirects';
import { SampleBadge } from '@shinefold/studio/document-badges/sample-badge/sample-badge';
import { SummaryReviewBadge } from '@shinefold/studio/document-badges/summary-review-badge/summary-review-badge';
import { PAGE_COOKIE_STATEMENT_TYPE } from '@shinefold/studio/schema-types/documents/pages/cookie-statement/cookie-statement-type';
import { PAGE_LANDING_TYPE } from '@shinefold/studio/schema-types/documents/pages/landing/landing-type';
import { PAGE_POST_TYPE } from '@shinefold/studio/schema-types/documents/pages/post/post-type';
import { migrationStateSchema } from '@shinefold/studio/schema-types/documents/system/migration-state/migration-state';
import { templateIdFor } from '@shinefold/studio/structure/locales/template-id-for';
import type { DocumentActionComponent, DocumentPluginOptions } from 'sanity';

const COOKIE_STATEMENT_LOCKED_ACTIONS: readonly string[] = [
  SANITY_DOCUMENT_ACTION.DELETE,
  SANITY_DOCUMENT_ACTION.DUPLICATE,
  SANITY_DOCUMENT_ACTION.UNPUBLISH,
];

const HIDDEN_NEW_DOCUMENT_TEMPLATE_IDS: readonly string[] = [
  migrationStateSchema.name,
  PAGE_COOKIE_STATEMENT_TYPE,
  ...Object.values(LOCALE_ISO_CODES).map((locale) =>
    templateIdFor(PAGE_COOKIE_STATEMENT_TYPE, locale),
  ),
];

const PREVIEWABLE_DOCUMENT_TYPES: readonly string[] = [
  PAGE_POST_TYPE,
  PAGE_LANDING_TYPE,
];

const withLandingPublish = (prev: DocumentActionComponent[]) =>
  prev.map((action) =>
    action.action === SANITY_DOCUMENT_ACTION.PUBLISH
      ? withLandingRedirects(action)
      : action,
  );

// Sanity renders the first action as the primary button, so the test send goes second to lead the menu.
const withSendTestAction = ([primary, ...rest]: DocumentActionComponent[]) =>
  primary ? [primary, SendTestAction, ...rest] : [SendTestAction];

const ACTIONS_BY_TYPE: Readonly<
  Record<string, (prev: DocumentActionComponent[]) => DocumentActionComponent[]>
> = {
  [PAGE_LANDING_TYPE]: withLandingPublish,
  [PAGE_POST_TYPE]: withSendTestAction,
};

export const buildDocumentOptions = (previewBasePath?: string) => {
  const previewAction = previewBasePath
    ? createPreviewAction(previewBasePath)
    : undefined;

  return {
    badges: (prev) => [...prev, SampleBadge, SummaryReviewBadge],
    actions: (prev, { schemaType }) => {
      if (schemaType === migrationStateSchema.name) return [];
      if (schemaType === PAGE_COOKIE_STATEMENT_TYPE) {
        return prev.filter(
          ({ action }) =>
            !action || !COOKIE_STATEMENT_LOCKED_ACTIONS.includes(action),
        );
      }

      const actions = ACTIONS_BY_TYPE[schemaType]?.(prev) ?? prev;

      return previewAction && PREVIEWABLE_DOCUMENT_TYPES.includes(schemaType)
        ? [...actions, previewAction]
        : actions;
    },
    newDocumentOptions: (prev) =>
      prev.filter(
        (item) => !HIDDEN_NEW_DOCUMENT_TEMPLATE_IDS.includes(item.templateId),
      ),
  } satisfies DocumentPluginOptions;
};
