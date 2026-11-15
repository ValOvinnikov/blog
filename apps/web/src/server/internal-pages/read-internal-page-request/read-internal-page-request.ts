import { INTERNAL_PAGES_LOG } from '@web/constants/internal-pages';
import {
  readSignedTenantRequest,
  type TSignedTenantRequest,
} from '@web/server/signed-request/read-signed-tenant-request/read-signed-tenant-request';
import { env } from '@web/utils/env/env';
import type { z } from 'zod';

export const readInternalPageRequest = <TBody extends { tenantId: string }>(
  request: Request,
  bodySchema: z.ZodType<TBody>,
): Promise<TSignedTenantRequest<TBody>> =>
  readSignedTenantRequest(request, bodySchema, {
    secret: env.INTERNAL_PAGES_SECRET,
    log: INTERNAL_PAGES_LOG,
  });
