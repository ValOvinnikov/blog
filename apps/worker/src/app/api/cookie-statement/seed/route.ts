import { HTTP_STATUS, LOCALE_ISO_CODES } from '@blog/config/constants';
import { getTenantById } from '@blog/db/queries/tenants';
import { sanitizeLogMessage } from '@blog/insight';
import { COOKIE_STATEMENT_LOG } from '@worker/constants/cookie-statement';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { env } from '@worker/utils/env/env';
import { logger } from '@worker/utils/logger/logger';
import {
  readSignedRequest,
  respond,
  respondError,
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

export async function POST(request: Request): Promise<Response> {
  const signed = await readSignedRequest(
    request,
    cookieStatementSeedBodySchema,
    env.WORKER_ENQUEUE_SECRET,
  );
  if (!signed.ok) return signed.error;
  const { tenantId, locales } = signed.data;

  try {
    const tenant = await getTenantById(tenantId);
    if (!tenant) {
      return respondError(HTTP_STATUS.NOT_FOUND, ENQUEUE_ERROR.NOT_FOUND);
    }
    if (!tenant.sanityProjectId || !tenant.sanityWriteTokenEncrypted) {
      return respondError(HTTP_STATUS.CONFLICT, ENQUEUE_ERROR.NOT_PROVISIONED);
    }

    const run = await start(seedCookieStatements, [tenantId, locales]);
    return respond(HTTP_STATUS.ACCEPTED, { runId: run.runId });
  } catch (error) {
    logger.error(COOKIE_STATEMENT_LOG.SEED_START_FAILED, {
      tenantId,
      locales,
      error: sanitizeLogMessage(error),
    });
    return respondError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ENQUEUE_ERROR.SERVER_ERROR,
    );
  }
}
