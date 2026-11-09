import { buildStarterCookieStatement } from '@blog/config';
import type { TLocaleIsoCode } from '@blog/config/constants';
import { getTenantSanityWriteCredentials } from '@blog/db/queries/tenants';
import { sanitizeLogMessage } from '@blog/insight';
import { COOKIE_STATEMENT_LOG } from '@worker/constants/cookie-statement';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import { SANITY_API_VERSION } from '@worker/constants/sanity-api';
import { logger } from '@worker/utils/logger/logger';
import { createClientWithTimeout } from '@worker/utils/step-deps/step-deps';
import { FatalError } from 'workflow';

import { isFinalStepAttempt } from './run-reported-step';

export async function ensureCookieStatementsSeeded(
  tenantId: string,
  locales: TLocaleIsoCode[],
): Promise<void> {
  'use step';

  try {
    const credentials = await getTenantSanityWriteCredentials(tenantId);
    if (!credentials) {
      throw new FatalError(
        `Tenant "${tenantId}" has no Sanity write credentials.`,
      );
    }

    const { projectId, dataset, token } = credentials;
    const transaction = createClientWithTimeout({
      projectId,
      dataset,
      token,
      apiVersion: SANITY_API_VERSION,
      useCdn: false,
    }).transaction();
    for (const locale of locales) {
      transaction.createIfNotExists(buildStarterCookieStatement(locale));
    }
    await transaction.commit();
  } catch (error) {
    if (isFinalStepAttempt(error)) {
      logger.error(COOKIE_STATEMENT_LOG.SEED_FAILED, {
        tenantId,
        locales,
        error: sanitizeLogMessage(error),
      });
    }
    throw error;
  }
}

ensureCookieStatementsSeeded.maxRetries = PROVISIONING_UNIT_MAX_RETRIES;
