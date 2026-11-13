import { DOMAIN_LABEL_PATTERN, LOCALE_ISO_CODES } from '@blog/config';
import { TENANT_PLAN } from '@blog/config/constants';
import { TENANT_FIELD_ERROR } from '@platform/constants/tenant';
import { toTenantFieldErrors } from '@platform/server/tenants/tenant-field-error';
import { z } from 'zod';

export const createTenantInputSchema = z.object({
  name: z.string().trim().min(1),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, { abort: true })
    .regex(DOMAIN_LABEL_PATTERN),
  locale: z.enum(LOCALE_ISO_CODES),
  plan: z.enum(TENANT_PLAN),
  ownerEmail: z.string().trim().toLowerCase().email(),
  confirmOwnerInviteToken: z.string().optional(),
});

export type TCreateTenantInput = z.input<typeof createTenantInputSchema>;

const toSlugFieldError = (issues: z.ZodError['issues']) =>
  issues.some(({ path, code }) => path[0] === 'slug' && code === 'too_small')
    ? TENANT_FIELD_ERROR.SLUG_REQUIRED
    : TENANT_FIELD_ERROR.SLUG_INVALID;

export const toCreateTenantFieldErrors = (issues: z.ZodError['issues']) =>
  toTenantFieldErrors<keyof TCreateTenantInput>(issues, {
    name: TENANT_FIELD_ERROR.NAME_REQUIRED,
    slug: toSlugFieldError(issues),
    locale: TENANT_FIELD_ERROR.LOCALE_UNSUPPORTED,
    plan: TENANT_FIELD_ERROR.PLAN_UNSUPPORTED,
    ownerEmail: TENANT_FIELD_ERROR.EMAIL_INVALID,
  });
