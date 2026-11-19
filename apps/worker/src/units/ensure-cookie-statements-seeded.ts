import { buildStarterCookieStatement } from '@shinefold/config';
import type { TLocaleIsoCode } from '@shinefold/config/constants';
import { sanitizeLogMessage } from '@shinefold/insight';
import { COOKIE_STATEMENT_LOG } from '@worker/constants/cookie-statement';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import { logger } from '@worker/utils/logger/logger';
import { createTenantWriteClient } from '@worker/utils/tenant-content/tenant-write-client';

import { isFinalStepAttempt } from './run-reported-step';

export async function ensureCookieStatementsSeeded(
  tenantId: string,
  locales: TLocaleIsoCode[],
): Promise<void> {
  'use step';

  try {
    const transaction = (await createTenantWriteClient(tenantId)).transaction();
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
