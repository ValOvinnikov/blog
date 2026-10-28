import { DOMAIN_PATTERN } from '@blog/config/constants';
import { tenantRequestBodySchema } from '@worker/utils/signed-tenant-request/signed-tenant-request';
import { z } from 'zod';

export const customDomainRequestBodySchema = tenantRequestBodySchema.extend({
  domain: z.string().trim().toLowerCase().regex(DOMAIN_PATTERN),
});
