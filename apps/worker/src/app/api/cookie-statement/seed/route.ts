import { HTTP_STATUS, LOCALE_ISO_CODES } from '@shinefold/config/constants';
import { sanitizeLogMessage } from '@shinefold/insight';
import { COOKIE_STATEMENT_LOG } from '@worker/constants/cookie-statement';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { env } from '@worker/utils/env/env';
import { logger } from '@worker/utils/logger/logger';
import {
  readSignedRequest,
  refuseUnwritableTenant,
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
    const refusal = await refuseUnwritableTenant(tenantId);
    if (refusal) return refusal;

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
