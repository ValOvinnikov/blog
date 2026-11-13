import type { TLocaleIsoCode } from '@blog/config';
import { TENANT_PLAN, type TTenantPlan } from '@blog/config/constants';
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

  const updateValues = (patch: Partial<TTenantDetailsValues>) => {
    setValues((prev) => ({ ...prev, ...patch }));
    if ('ownerEmail' in patch) {
      onOwnerEmailChange();
    }
  };

  return { values, updateValues };
};
