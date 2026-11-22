import { getMemberStudioAccess } from '@shinefold/db/queries/memberships';
import { tenantRequestBodySchema } from '@worker/utils/signed-tenant-request/signed-tenant-request';
import { z } from 'zod';

import { wakeMemberAccess } from './member-access-run';

const memberAccessRequestBodySchema = tenantRequestBodySchema.extend({
  membershipId: z.uuid(),
});

type TMemberAccessRequestBody = z.infer<typeof memberAccessRequestBodySchema>;

export const memberAccessRequest = {
  schema: memberAccessRequestBodySchema,
  wake: ({ tenantId, membershipId }: TMemberAccessRequestBody) =>
    wakeMemberAccess(tenantId, membershipId),
  exists: async ({ tenantId, membershipId }: TMemberAccessRequestBody) =>
    !!(await getMemberStudioAccess(tenantId, membershipId)),
  logContext: ({ membershipId }: TMemberAccessRequestBody) => ({
    membershipId,
  }),
};
