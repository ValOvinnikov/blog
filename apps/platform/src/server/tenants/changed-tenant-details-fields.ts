import type { TMaybeUndefined } from '@blog/config';
import type { TUpdateTenantDetailsInput } from '@blog/db/queries/tenants/update-tenant-details/update-tenant-details';
import type { TTenant } from '@blog/db/schema/tenants';
import { isUndefined, objectKeys } from '@blog/utils/primitives';
import {
  TENANT_DETAILS_FIELD,
  type TTenantDetailsField,
} from '@platform/constants/tenant';

type TComparedDetails = Omit<TUpdateTenantDetailsInput, 'ownerEmail'>;

const COMPARED_FIELD = {
  name: TENANT_DETAILS_FIELD.NAME,
  primaryDomain: TENANT_DETAILS_FIELD.PRIMARY_DOMAIN,
  plan: TENANT_DETAILS_FIELD.PLAN,
  locale: TENANT_DETAILS_FIELD.LOCALE,
} as const satisfies Record<keyof TComparedDetails, TTenantDetailsField>;

export const changedTenantDetailsFields = (
  saved: TComparedDetails,
  previous: TTenant,
  previousOwnerEmail: TMaybeUndefined<string>,
): TTenantDetailsField[] => [
  ...objectKeys(COMPARED_FIELD)
    .filter((key) => saved[key] !== previous[key])
    .map((key) => COMPARED_FIELD[key]),
  ...(isUndefined(previousOwnerEmail)
    ? []
    : [TENANT_DETAILS_FIELD.OWNER_EMAIL]),
];
