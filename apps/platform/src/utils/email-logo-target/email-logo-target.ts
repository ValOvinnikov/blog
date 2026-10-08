import { EMAIL_TEMPLATE_TYPE_VALUES } from '@platform/utils/email-input-schemas/email-input-schemas';
import { z } from 'zod';

export const emailLogoTargetSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('tenant') }),
  z.object({
    type: z.literal('template'),
    templateType: z.enum(EMAIL_TEMPLATE_TYPE_VALUES),
  }),
]);

export type TEmailLogoTarget = z.infer<typeof emailLogoTargetSchema>;
