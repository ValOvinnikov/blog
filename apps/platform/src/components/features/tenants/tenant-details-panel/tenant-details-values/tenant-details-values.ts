import type { TFieldErrors, TMaybeUndefined } from '@blog/config';
import type { TTenantPlan } from '@blog/db/constants';
import type { TTenantDetailsFieldError } from '@platform/server/tenants/tenant-field-error';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';

export type TTenantDetailsValues = {
  name: string;
  primaryDomain: string;
  plan: TTenantPlan;
  locale: string;
  ownerEmail: string;
};

export type TTenantDetailsFieldErrors = TFieldErrors<
  keyof TTenantDetailsValues,
  TTenantDetailsFieldError
>;

export const tenantDetailsValuesOf = (
  tenant: TClientTenant,
  ownerEmail: TMaybeUndefined<string>,
): TTenantDetailsValues => {
  const { name, primaryDomain, plan, locale } = tenant;

  return { name, primaryDomain, plan, locale, ownerEmail: ownerEmail ?? '' };
};
