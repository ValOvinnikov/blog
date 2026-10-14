import { emailTemplateTypeSchema } from '@platform/utils/email-input-schemas/email-input-schemas';
import { z } from 'zod';

export const emailLogoTargetSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('tenant') }),
  z.object({
    type: z.literal('template'),
    templateType: emailTemplateTypeSchema,
  }),
]);

export type TEmailLogoTarget = z.infer<typeof emailLogoTargetSchema>;
