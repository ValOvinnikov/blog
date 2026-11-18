import { tenantRequestBodySchema } from '@worker/utils/signed-tenant-request/signed-tenant-request';
import { z } from 'zod';

import { wakeOwnerAccess } from './owner-access-run';

const ownerAccessRequestBodySchema = tenantRequestBodySchema.extend({
  formerOwnerEmail: z.string().trim().pipe(z.email()).optional(),
});

type TOwnerAccessRequestBody = z.infer<typeof ownerAccessRequestBodySchema>;

export const ownerAccessRequest = {
  schema: ownerAccessRequestBodySchema,
  wake: ({ tenantId }: TOwnerAccessRequestBody) => wakeOwnerAccess(tenantId),
};
