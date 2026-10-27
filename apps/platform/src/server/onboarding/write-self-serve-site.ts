import 'server-only';

import { ACTION_OUTCOME, ERROR_CODE } from '@blog/config';
import { queries } from '@blog/db';
import type { TCreateSelfServeTenantInput } from '@blog/db/queries/tenants';
import { errorResult, okResult, type TResult } from '@blog/utils';
import { toOutcome } from '@blog/utils/to-outcome';
import { ONBOARDING_LOG } from '@platform/constants/onboarding';
import { TENANT_FIELD_ERROR, TENANT_REFUSAL } from '@platform/constants/tenant';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';

import type { TCreateSiteResult } from './create-site-input';

const RESULT_BY_ERROR_CODE: Partial<Record<string, TCreateSiteResult>> = {
  [ERROR_CODE.DB_DUPLICATE_DOMAIN]: {
    outcome: ACTION_OUTCOME.INVALID,
    fieldErrors: { slug: { reason: TENANT_FIELD_ERROR.SLUG_TAKEN } },
  },
  [ERROR_CODE.DB_ALREADY_OWNS_FREE_TENANT]: {
    outcome: ACTION_OUTCOME.REFUSED,
    reason: TENANT_REFUSAL.OWNER_HAS_FREE_TENANT,
  },
};

export const writeSelfServeSite = async (
  input: TCreateSelfServeTenantInput,
): Promise<TResult<string, TCreateSiteResult>> => {
  const { domain } = input;

  try {
    const result = await queries.tenants.createSelfServeTenant(input);
    if (result.ok) return okResult(result.data.id);

    const refusal = RESULT_BY_ERROR_CODE[result.error];
    if (refusal) return errorResult(refusal);

    logger.error(ONBOARDING_LOG.CREATE_FAILED, {
      domain,
      errorCode: result.error,
    });
  } catch (error) {
    logger.error(ONBOARDING_LOG.CREATE_FAILED, {
      domain,
      ...toLoggableError(error),
    });
  }

  return errorResult(toOutcome(ACTION_OUTCOME.SERVER_ERROR));
};
