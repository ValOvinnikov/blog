'use server';

import {
  SAMPLE_CONTENT_LOG,
  SAMPLE_CONTENT_PATH,
  SAMPLE_CONTENT_REFUSAL,
  type TSampleContentRefusal,
} from '@platform/constants/sample-content';
import { requireTenantManager } from '@platform/server/auth/require-tenant-manager';
import {
  isWorkerRequestFailure,
  sendWorkerRequest,
} from '@platform/server/provisioning/enqueue-provisioning';
import { logger } from '@platform/utils/logger/logger';
import { ACTION_OUTCOME, HTTP_STATUS } from '@shinefold/config';
import { isTenantWritable } from '@shinefold/db/utils/is-tenant-writable/is-tenant-writable';
import { toOutcome } from '@shinefold/utils/to-outcome';
import { z } from 'zod';

import {
  sampleRemovalResponseSchema,
  type TKeptSamples,
  toKeptSample,
} from './kept-sample';

// The worker removes every sample in one Sanity transaction before it answers.
const SAMPLE_REMOVAL_TIMEOUT_MS = 60_000;

const workerRefusalSchema = z.object({
  error: z.literal(SAMPLE_CONTENT_REFUSAL.NOT_WRITABLE),
});

const refused = (): TRemoveSampleContentResult => ({
  outcome: ACTION_OUTCOME.REFUSED,
  reason: SAMPLE_CONTENT_REFUSAL.NOT_WRITABLE,
});

export type TRemoveSampleContentResult =
  | ({
      outcome: typeof ACTION_OUTCOME.SUCCESS;
      removedCount: number;
    } & TKeptSamples)
  | {
      outcome: typeof ACTION_OUTCOME.REFUSED;
      reason: TSampleContentRefusal;
    }
  | { outcome: typeof ACTION_OUTCOME.SERVER_ERROR };

export const removeSampleContentAction = async (
  tenantId: string,
): Promise<TRemoveSampleContentResult> => {
  const { tenant } = await requireTenantManager(tenantId);

  if (!isTenantWritable(tenant)) return refused();

  const response = await sendWorkerRequest(
    SAMPLE_CONTENT_PATH.REMOVE,
    { tenantId },
    { timeoutMs: SAMPLE_REMOVAL_TIMEOUT_MS, readsBody: true },
  );

  if (isWorkerRequestFailure(response)) {
    const { failureEvent, failure } = response;
    logger.error(failureEvent, { tenantId, ...failure });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }

  const { status, body } = response;
  if (
    status === HTTP_STATUS.CONFLICT &&
    workerRefusalSchema.safeParse(body).success
  ) {
    return refused();
  }
  if (status !== HTTP_STATUS.OK) {
    logger.error(SAMPLE_CONTENT_LOG.REMOVAL_FAILED, {
      tenantId,
      responseStatus: status,
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }

  const parsed = sampleRemovalResponseSchema.safeParse(body);
  if (!parsed.success) {
    logger.error(SAMPLE_CONTENT_LOG.REMOVAL_RESPONSE_INVALID, { tenantId });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }

  const { removed, keptEdited, keptReferenced } = parsed.data;
  return {
    outcome: ACTION_OUTCOME.SUCCESS,
    removedCount: removed.length,
    keptEdited: keptEdited.map(toKeptSample),
    keptReferenced: keptReferenced.map(toKeptSample),
  };
};
