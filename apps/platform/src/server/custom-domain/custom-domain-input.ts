import { DOMAIN_PATTERN } from '@blog/config';
import { z } from 'zod';

export const customDomainInputSchema = z.object({
  domain: z.string().trim().toLowerCase().regex(DOMAIN_PATTERN),
});

export type TCustomDomainInput = z.input<typeof customDomainInputSchema>;
