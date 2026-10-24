import 'server-only';

import {
  ACTION_OUTCOME,
  AUDIT_TARGET_TYPE,
  type TActionResult,
  type TAuditAction,
  type TErrorCode,
  type TOutcome,
} from '@blog/config';
import { ERROR_CODE } from '@blog/config/constants';
import type { TPersonalDataCounts } from '@blog/db/queries/personal-data/erase-personal-data';
import { errorResult, type TResult } from '@blog/utils';
import { toOutcome } from '@blog/utils/to-outcome';
import { DATA_REQUEST_LOG } from '@platform/constants/data-request';
import { TENANT_FIELD_ERROR } from '@platform/constants/tenant';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { logger } from '@platform/utils/logger/logger';
import { z } from 'zod';

const dataRequestInputSchema = z.object({
  email: z.string().trim().email(),
});

export type TDataRequestInput = z.input<typeof dataRequestInputSchema>;

export type TDataRequestFailure = Exclude<
  TActionResult<
    typeof ACTION_OUTCOME.SERVER_ERROR,
    keyof TDataRequestInput,
    typeof TENANT_FIELD_ERROR.EMAIL_INVALID
  >,
  TOutcome<typeof ACTION_OUTCOME.SUCCESS>
>;

const INVALID_EMAIL: TDataRequestFailure = {
  outcome: ACTION_OUTCOME.INVALID,
  fieldErrors: {
    email: { reason: TENANT_FIELD_ERROR.EMAIL_INVALID },
  },
};

type TDataRequestStep<TData extends { emailIndex: string }> = {
  run: (email: string) => Promise<TResult<TData, TErrorCode>>;
  action: TAuditAction;
  auditDetails: (data: TData) => TPersonalDataCounts;
};

// A failed query's message lists its bound parameters, the email among them, so only its name is logged.
const errorName = (error: unknown): string =>
  error instanceof Error ? error.name : typeof error;

export const runDataRequest = async <TData extends { emailIndex: string }>(
  input: TDataRequestInput,
  { run, action, auditDetails }: TDataRequestStep<TData>,
): Promise<TResult<TData, TDataRequestFailure>> => {
  const parsed = dataRequestInputSchema.safeParse(input);
  if (!parsed.success) return errorResult(INVALID_EMAIL);

  try {
    const result = await run(parsed.data.email);

    if (result.ok) {
      await recordAuditEvent({
        logEvent: DATA_REQUEST_LOG.AUDIT_FAILED,
        action,
        targetType: AUDIT_TARGET_TYPE.PERSONAL_DATA,
        targetId: result.data.emailIndex,
        details: auditDetails(result.data),
      });
      return result;
    }

    if (result.error === ERROR_CODE.DB_INVALID_EMAIL) {
      return errorResult(INVALID_EMAIL);
    }

    logger.error(DATA_REQUEST_LOG.FAILED, { action, error: result.error });
  } catch (error) {
    logger.error(DATA_REQUEST_LOG.FAILED, {
      action,
      errorName: errorName(error),
    });
  }

  return errorResult(toOutcome(ACTION_OUTCOME.SERVER_ERROR));
};
