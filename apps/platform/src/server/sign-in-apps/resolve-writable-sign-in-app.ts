import 'server-only';

import { SIGN_IN_APP_REFUSAL } from '@platform/constants/sign-in-apps';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import {
  ACTION_OUTCOME,
  type TOutcome,
  type TReasonedFailure,
} from '@shinefold/config';
import { toOutcome } from '@shinefold/utils/to-outcome';
import type { z } from 'zod';

import { requireSignInAppOwner } from './require-sign-in-app-owner';

export type TWritableSignInApp<TInput> =
  | {
      outcome: typeof ACTION_OUTCOME.SUCCESS;
      tenant: TPlatformTenant;
      input: TInput;
    }
  | TOutcome<typeof ACTION_OUTCOME.INVALID>
  | (TOutcome<typeof ACTION_OUTCOME.REFUSED> &
      TReasonedFailure<typeof SIGN_IN_APP_REFUSAL.ARCHIVED>);

export const resolveWritableSignInApp = async <TSchema extends z.ZodType>(
  tenantId: string,
  schema: TSchema,
  input: unknown,
): Promise<TWritableSignInApp<z.output<TSchema>>> => {
  const { tenant } = await requireSignInAppOwner(tenantId);

  const parsed = schema.safeParse(input);
  if (!parsed.success) return toOutcome(ACTION_OUTCOME.INVALID);
  if (tenant.isArchived) {
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: SIGN_IN_APP_REFUSAL.ARCHIVED,
    };
  }

  return { outcome: ACTION_OUTCOME.SUCCESS, tenant, input: parsed.data };
};
