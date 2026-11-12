import type { TLocaleIsoCode } from '@blog/config/constants';
import type { TTenantPlan, TTenantStatus } from '@blog/db/constants';
import {
  planChangeFields,
  type TPlanChangeFields,
} from '@blog/db/queries/tenants/plan-change-fields';
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

export function tenantDetailsWrite(
  details: TTenantDetailsFields,
  status: TTenantStatus,
  clearsUnsentReinvite: boolean,
): TTenantDetailsFields &
  TPlanChangeFields & { unsentReinviteFormerOwnerEmailEncrypted?: null } {
  return {
    ...details,
    ...planChangeFields(details.plan, status),
    ...(clearsUnsentReinvite && {
      unsentReinviteFormerOwnerEmailEncrypted: null,
    }),
  };
}

export function restorableTenantFields(
  original: TTenant,
): TTenantDetailsFields &
  Pick<
    TTenant,
    'unsentReinviteFormerOwnerEmailEncrypted' | 'selfServeOwnerEmailIndex'
  > {
  return {
    ...tenantDetailsFields(original),
    unsentReinviteFormerOwnerEmailEncrypted:
      original.unsentReinviteFormerOwnerEmailEncrypted,
    selfServeOwnerEmailIndex: original.selfServeOwnerEmailIndex,
  };
}
