import type { TTenantProvisioningStep } from '@blog/db/constants';
import type { z } from 'zod';

type TTenantFieldErrorReason =
  | 'nameRequired'
  | 'domainInvalid'
  | 'domainTaken'
  | 'domainAttachedElsewhere'
  | 'emailInvalid'
  | 'localeUnsupported'
  | 'planUnsupported'
  | 'ownerEmailTaken';

export type TTenantFieldError =
  | { reason: TTenantFieldErrorReason }
  | { reason: 'domainLocked'; step: TTenantProvisioningStep };

export const toTenantFieldErrors = <TField extends string>(
  issues: z.ZodError['issues'],
  reasonByField: Partial<Record<TField, TTenantFieldErrorReason>>,
): Partial<Record<TField, TTenantFieldError>> => {
  const fieldErrors: Partial<Record<TField, TTenantFieldError>> = {};
  for (const { path } of issues) {
    const field = path[0] as TField;
    const reason = reasonByField[field];
    if (reason && !(field in fieldErrors)) {
      fieldErrors[field] = { reason };
    }
  }
  return fieldErrors;
};
