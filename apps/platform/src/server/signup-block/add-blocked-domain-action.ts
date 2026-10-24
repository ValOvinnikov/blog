'use server';

import { ACTION_OUTCOME, type TActionResult } from '@blog/config';
import { ERROR_CODE } from '@blog/config/constants';
import { BLOCKED_IDENTITY_KIND } from '@blog/db/constants';
import { toOutcome } from '@blog/utils/to-outcome';
import {
  SIGNUP_BLOCK_FIELD_ERROR,
  type TSignupBlockFieldError,
  SIGNUP_BLOCK_LOG,
} from '@platform/constants/signup-block';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { addSignupBlock } from '@platform/server/signup-block/add-signup-block';
import { signupBlockReasonSchema } from '@platform/server/signup-block/signup-block-reason-schema';
import { toTenantFieldErrors } from '@platform/server/tenants/tenant-field-error';
import { logger } from '@platform/utils/logger/logger';
import { z } from 'zod';

const addBlockedDomainInputSchema = z.object({
  domain: z.string().trim().min(1),
  reason: signupBlockReasonSchema,
});

export type TAddBlockedDomainInput = z.input<
  typeof addBlockedDomainInputSchema
>;

export type TAddBlockedDomainResult = TActionResult<
  typeof ACTION_OUTCOME.SERVER_ERROR,
  keyof TAddBlockedDomainInput,
  TSignupBlockFieldError
>;

export const addBlockedDomainAction = async (
  input: TAddBlockedDomainInput,
): Promise<TAddBlockedDomainResult> => {
  const admin = await requireSuperAdmin();

  const parsed = addBlockedDomainInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: toTenantFieldErrors<
        keyof TAddBlockedDomainInput,
        TSignupBlockFieldError
      >(parsed.error.issues, {
        domain: SIGNUP_BLOCK_FIELD_ERROR.BLOCK_DOMAIN_INVALID,
        reason: SIGNUP_BLOCK_FIELD_ERROR.BLOCK_REASON_REQUIRED,
      }),
    };
  }

  const { domain, reason } = parsed.data;
  try {
    const result = await addSignupBlock({
      kind: BLOCKED_IDENTITY_KIND.DOMAIN,
      identity: domain,
      reason,
      admin,
    });

    if (result.ok) return toOutcome(ACTION_OUTCOME.SUCCESS);

    if (result.error === ERROR_CODE.DB_INVALID_DOMAIN) {
      return {
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors: {
          domain: { reason: SIGNUP_BLOCK_FIELD_ERROR.BLOCK_DOMAIN_INVALID },
        },
      };
    }

    logger.error(SIGNUP_BLOCK_LOG.ADD_DOMAIN_FAILED, { error: result.error });
  } catch (error) {
    logger.error(SIGNUP_BLOCK_LOG.ADD_DOMAIN_FAILED, { error });
  }

  return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
};
