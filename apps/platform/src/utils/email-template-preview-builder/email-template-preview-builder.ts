import { EMAIL_TEMPLATE_TYPE, type TEmailTemplateType } from '@blog/config';
import type { TEmailTemplateBlock } from '@blog/db/schema/email-templates';
import type { TTenantEmailBrand } from '@blog/email/html';
import {
  buildInviteMagicLinkEmail,
  buildMagicLinkEmail,
  buildNewsletterConfirmationEmail,
} from '@blog/email/templates/tenant';

export type TEmailTemplatePreviewInput = {
  subject: string;
  body: TEmailTemplateBlock[];
  brand: TTenantEmailBrand;
  brandName: string;
  logoImageUrl?: string;
  footerPostalAddress?: string;
};

const PREVIEW_ACTION_URL = 'https://example.com';

const PREVIEW_BUILDERS: Record<
  TEmailTemplateType,
  (input: TEmailTemplatePreviewInput) => string
> = {
  [EMAIL_TEMPLATE_TYPE.MAGIC_LINK]: ({ brand, brandName, ...copy }) =>
    buildMagicLinkEmail({
      ...copy,
      url: PREVIEW_ACTION_URL,
      tenantIdentity: { brand, brandName },
    }).html,
  [EMAIL_TEMPLATE_TYPE.TENANT_INVITE]: ({ brand, brandName, ...copy }) =>
    buildInviteMagicLinkEmail({
      ...copy,
      url: PREVIEW_ACTION_URL,
      tenantIdentity: { brand, brandName },
      tenantNames: [brandName],
    }).html,
  [EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION]: (input) =>
    buildNewsletterConfirmationEmail({
      ...input,
      confirmationUrl: PREVIEW_ACTION_URL,
      unsubscribeUrl: PREVIEW_ACTION_URL,
    }).html,
};

/**
 * Renders a template type through the same `@blog/email` builder its sender
 * calls, with placeholder action URLs and the tenant's own name as the
 * invited organisation.
 */
export const buildEmailTemplatePreviewHtml = (
  templateType: TEmailTemplateType,
  input: TEmailTemplatePreviewInput,
): string => PREVIEW_BUILDERS[templateType](input);
