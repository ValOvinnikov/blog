import { HTTP_STATUS, LOCALE_ISO_CODES } from '@shinefold/config/constants';
import { COOKIE_STATEMENT_LOG } from '@worker/constants/cookie-statement';
import { handleSignedTenantRequest } from '@worker/utils/signed-tenant-request/handle-signed-tenant-request';
import {
  respond,
  tenantRequestBodySchema,
} from '@worker/utils/signed-tenant-request/signed-tenant-request';
import { seedCookieStatements } from '@worker/workflows/seed-cookie-statements';
import { start } from 'workflow/api';
import { z } from 'zod';

const cookieStatementSeedBodySchema = tenantRequestBodySchema.extend({
  locales: z
    .array(z.enum(LOCALE_ISO_CODES))
    .min(1)
    .transform((locales) => [...new Set(locales)]),
});

export function POST(request: Request): Promise<Response> {
  return handleSignedTenantRequest(request, {
    schema: cookieStatementSeedBodySchema,
    failureEvent: COOKIE_STATEMENT_LOG.SEED_START_FAILED,
    run: async ({ tenantId, locales }) => {
      const { runId } = await start(seedCookieStatements, [tenantId, locales]);
      return respond(HTTP_STATUS.ACCEPTED, { runId });
    },
  });
}
