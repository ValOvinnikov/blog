import type { TLocaleIsoCode } from '@blog/config';
import { TENANT_PLAN, type TTenantPlan } from '@blog/db/constants';
import { routing } from '@platform/i18n/routing';
import { useState } from 'react';

type TTenantDetailsValues = {
  name: string;
  slug: string;
  locale: TLocaleIsoCode;
  plan: TTenantPlan;
  ownerEmail: string;
};

const INITIAL_VALUES: TTenantDetailsValues = {
  name: '',
  slug: '',
  locale: routing.defaultLocale,
  plan: TENANT_PLAN.FREE,
  ownerEmail: '',
};

export const useTenantDetailsValues = (onOwnerEmailChange: () => void) => {
  const [values, setValues] = useState<TTenantDetailsValues>(INITIAL_VALUES);

  const updateField = <K extends keyof TTenantDetailsValues>(
    key: K,
    value: TTenantDetailsValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (key === 'ownerEmail') {
      onOwnerEmailChange();
    }
  };

  return { values, updateField };
};
