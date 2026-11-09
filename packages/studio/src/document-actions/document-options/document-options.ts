import {
  LOCALE_ISO_CODES,
  SANITY_DOCUMENT_ACTION,
} from '@blog/config/constants';
import { withLandingRedirects } from '@blog/studio/document-actions/with-landing-redirects/with-landing-redirects';
import { PAGE_COOKIE_STATEMENT_TYPE } from '@blog/studio/schema-types/documents/pages/cookie-statement/cookie-statement-type';
import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { migrationStateSchema } from '@blog/studio/schema-types/documents/system/migration-state/migration-state';
import { templateIdFor } from '@blog/studio/structure/locales/template-id-for';
import type { DocumentPluginOptions } from 'sanity';

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

export const documentOptions = {
  actions: (prev, { schemaType }) => {
    if (schemaType === migrationStateSchema.name) return [];
    if (schemaType === PAGE_COOKIE_STATEMENT_TYPE) {
      return prev.filter(
        ({ action }) =>
          !action || !COOKIE_STATEMENT_LOCKED_ACTIONS.includes(action),
      );
    }
    if (schemaType !== PAGE_LANDING_TYPE) return prev;

    return prev.map((action) =>
      action.action === SANITY_DOCUMENT_ACTION.PUBLISH
        ? withLandingRedirects(action)
        : action,
    );
  },
  newDocumentOptions: (prev) =>
    prev.filter(
      (item) => !HIDDEN_NEW_DOCUMENT_TEMPLATE_IDS.includes(item.templateId),
    ),
} satisfies DocumentPluginOptions;
