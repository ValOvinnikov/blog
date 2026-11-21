import 'server-only';

import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { ACTION_OUTCOME } from '@shinefold/config';
import { errorResult, okResult, type TResult } from '@shinefold/utils';
import type { z } from 'zod';

import type { TChangePlanResult } from './plan-change-outcome';
import { readChangeableSubscription } from './read-changeable-subscription';
import type { TTenantSubscriptionPlan } from './read-tenant-subscription-plan';

type TChangeRequest<TInput> = TTenantSubscriptionPlan & { input: TInput };

export const readChangeRequest = async <TSchema extends z.ZodType>(
  tenantId: string,
  schema: TSchema,
  input: unknown,
): Promise<TResult<TChangeRequest<z.output<TSchema>>, TChangePlanResult>> => {
  const membership = await requireTenantMembership(tenantId);

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return errorResult({ outcome: ACTION_OUTCOME.INVALID, fieldErrors: {} });
  }

  const read = await readChangeableSubscription(membership);
  if (!read.ok) return read;
  return okResult({ ...read.data, input: parsed.data });
};
