import type { TLocaleIsoCode } from '@blog/config/constants';
import type { TTenantPlan } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';

type TTenantDetailsFields = {
  name: string;
  primaryDomain: string;
  plan: TTenantPlan;
  locale: TLocaleIsoCode;
};

export function tenantDetailsFields(
  source: TTenantDetailsFields,
): TTenantDetailsFields {
  return {
    name: source.name,
    primaryDomain: source.primaryDomain,
    plan: source.plan,
    locale: source.locale,
  };
}

const EDITABLE_AFTER_PROVISIONING: readonly (keyof TTenantDetailsFields)[] = [
  'plan',
];

export function changesProvisionedTenantDetails(
  next: TTenantDetailsFields,
  existing: TTenant,
): boolean {
  const current = tenantDetailsFields(existing);
  return (Object.keys(current) as (keyof TTenantDetailsFields)[]).some(
    (key) =>
      !EDITABLE_AFTER_PROVISIONING.includes(key) && next[key] !== current[key],
  );
}

export function restorableTenantFields(
  original: TTenant,
): TTenantDetailsFields &
  Pick<TTenant, 'unsentReinviteFormerOwnerEmailEncrypted'> {
  return {
    ...tenantDetailsFields(original),
    unsentReinviteFormerOwnerEmailEncrypted:
      original.unsentReinviteFormerOwnerEmailEncrypted,
  };
}
