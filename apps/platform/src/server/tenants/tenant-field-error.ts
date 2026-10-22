import type { TFieldErrors } from '@blog/config';
import type { TTenantFieldErrorReason } from '@platform/constants/tenant';
import type { TConfirmTenantFieldError } from '@platform/server/provisioning/resolve-confirmed-tenant';
import type { z } from 'zod';

export type TTenantDetailsFieldError = Exclude<
  TTenantFieldErrorReason,
  TConfirmTenantFieldError
>;

export const toTenantFieldErrors = <
  TField extends string,
  TReason extends string = TTenantDetailsFieldError,
>(
  issues: z.ZodError['issues'],
  reasonByField: Partial<Record<TField, TReason>>,
): TFieldErrors<TField, TReason> => {
  const fieldErrors: TFieldErrors<TField, TReason> = {};
  for (const { path } of issues) {
    const field = path[0] as TField;
    const reason = reasonByField[field];
    if (reason && !(field in fieldErrors)) {
      fieldErrors[field] = { reason };
    }
  }
  return fieldErrors;
};
