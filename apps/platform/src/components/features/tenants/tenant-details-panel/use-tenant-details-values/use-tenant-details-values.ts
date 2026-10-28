'use client';

import type { TMaybeUndefined } from '@blog/config';
import {
  tenantDetailsValuesOf,
  type TTenantDetailsValues,
} from '@platform/components/features/tenants/tenant-details-panel/tenant-details-values';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import {
  ALL_FIELD_KEYS,
  type TTenantFieldKey,
} from '@platform/utils/tenant-field-locks/tenant-field-locks';
import { useState } from 'react';

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

  const changedFieldKeys = ALL_FIELD_KEYS.filter(
    (key) => values[key] !== baselineValues[key],
  );

  return { values, updateField, revertFields, resetValues, changedFieldKeys };
};
