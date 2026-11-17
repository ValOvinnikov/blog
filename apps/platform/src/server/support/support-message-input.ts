import 'server-only';

import {
  SUPPORT_FIELD_ERROR,
  SUPPORT_LIMIT,
  type TSupportFieldError,
} from '@platform/constants/support';
import type { TFieldErrors } from '@shinefold/config';
import { z } from 'zod';

export const sendSupportMessageInputSchema = z.object({
  subject: z.string().trim().min(1).max(SUPPORT_LIMIT.SUBJECT_MAX_LENGTH),
  message: z.string().trim().min(1).max(SUPPORT_LIMIT.MESSAGE_MAX_LENGTH),
  originPath: z
    .string()
    .startsWith('/')
    .max(SUPPORT_LIMIT.ORIGIN_PATH_MAX_LENGTH)
    .optional()
    .catch(undefined),
});

export type TSendSupportMessageInput = z.input<
  typeof sendSupportMessageInputSchema
>;

export type TSupportField = 'subject' | 'message';

const MAX_LENGTH_BY_FIELD = {
  subject: SUPPORT_LIMIT.SUBJECT_MAX_LENGTH,
  message: SUPPORT_LIMIT.MESSAGE_MAX_LENGTH,
} as const satisfies Record<TSupportField, number>;

export const toSupportFieldErrors = (
  issues: z.ZodError['issues'],
): TFieldErrors<TSupportField, TSupportFieldError> => {
  const fieldErrors: TFieldErrors<TSupportField, TSupportFieldError> = {};
  for (const { path, code } of issues) {
    const field = path[0] as TSupportField;
    if (field in fieldErrors) continue;
    fieldErrors[field] =
      code === 'too_big'
        ? {
            reason: SUPPORT_FIELD_ERROR.TOO_LONG,
            values: { limit: MAX_LENGTH_BY_FIELD[field] },
          }
        : { reason: SUPPORT_FIELD_ERROR.REQUIRED };
  }
  return fieldErrors;
};
