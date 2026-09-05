import { EMAIL_TEMPLATE_TYPE, type TEmailTemplateType } from '@blog/config';
import { z } from 'zod';

const EMAIL_TEMPLATE_TYPE_VALUES = Object.values(EMAIL_TEMPLATE_TYPE) as [
  TEmailTemplateType,
  ...TEmailTemplateType[],
];

/**
 * Which row an email-logo upload/clear persists to — the tenant's own
 * `email_config` row, or one template's `email_templates` row. Distinct
 * targets sharing one schema, not a `kind` bolted onto the site's own
 * brand-asset action.
 */
export const emailLogoTargetSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('tenant') }),
  z.object({
    type: z.literal('template'),
    templateType: z.enum(EMAIL_TEMPLATE_TYPE_VALUES),
  }),
]);

export type TEmailLogoTarget = z.infer<typeof emailLogoTargetSchema>;
