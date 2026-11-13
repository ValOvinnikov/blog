import { DOMAIN_PATTERN, isLocaleIsoCode } from '@blog/config';
import { TENANT_PLAN } from '@blog/config/constants';
import { TENANT_FIELD_ERROR } from '@platform/constants/tenant';
import { toTenantFieldErrors } from '@platform/server/tenants/tenant-field-error';
import { z } from 'zod';

export const updateTenantDetailsInputSchema = z.object({
  name: z.string().trim().min(1),
  primaryDomain: z.string().trim().toLowerCase().regex(DOMAIN_PATTERN),
  plan: z.enum(TENANT_PLAN),
  locale: z.string().refine(isLocaleIsoCode),
  ownerEmail: z.string().trim().toLowerCase().email().optional(),
});

export type TUpdateTenantDetailsActionInput = z.input<
  typeof updateTenantDetailsInputSchema
>;

export const toUpdateTenantDetailsFieldErrors = (
  issues: z.ZodError['issues'],
) =>
  toTenantFieldErrors<keyof TUpdateTenantDetailsActionInput>(issues, {
    name: TENANT_FIELD_ERROR.NAME_REQUIRED,
    primaryDomain: TENANT_FIELD_ERROR.DOMAIN_INVALID,
    plan: TENANT_FIELD_ERROR.PLAN_UNSUPPORTED,
    locale: TENANT_FIELD_ERROR.LOCALE_UNSUPPORTED,
    ownerEmail: TENANT_FIELD_ERROR.EMAIL_INVALID,
  });
