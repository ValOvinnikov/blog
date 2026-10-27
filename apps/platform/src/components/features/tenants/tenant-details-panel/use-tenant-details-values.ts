'use client';

import type { TMaybeUndefined } from '@blog/config';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import {
  ALL_FIELD_KEYS,
  type TTenantFieldKey,
} from '@platform/utils/tenant-field-locks/tenant-field-locks';
import { useState } from 'react';

import {
  tenantDetailsValuesOf,
  type TTenantDetailsValues,
} from './tenant-details-values';

export const useTenantDetailsValues = (
  tenant: TClientTenant,
  ownerEmail: TMaybeUndefined<string>,
) => {
  const baselineValues = tenantDetailsValuesOf(tenant, ownerEmail);
  const [renderedTenant, setRenderedTenant] = useState(tenant);
  const [renderedOwnerEmail, setRenderedOwnerEmail] = useState(ownerEmail);
  const [values, setValues] = useState<TTenantDetailsValues>(baselineValues);

  if (tenant !== renderedTenant || ownerEmail !== renderedOwnerEmail) {
    setRenderedTenant(tenant);
    setRenderedOwnerEmail(ownerEmail);
    setValues(baselineValues);
  }

  const updateField = <K extends keyof TTenantDetailsValues>(
    key: K,
    nextValue: TTenantDetailsValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: nextValue }));
  };

  const revertFields = (keys: TTenantFieldKey[]) => {
    setValues((prev) => ({
      ...prev,
      ...Object.fromEntries(keys.map((key) => [key, baselineValues[key]])),
    }));
  };

  const resetValues = () => {
    setValues(baselineValues);
  };

  const changeCount = ALL_FIELD_KEYS.filter(
    (key) => values[key] !== baselineValues[key],
  ).length;

  return { values, updateField, revertFields, resetValues, changeCount };
};
