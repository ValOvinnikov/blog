'use client';

import type { TMaybeUndefined, TReasonedFailure } from '@blog/config';
import { TENANT_PROVISIONING_STEP } from '@blog/db/constants';
import { TENANT_FIELD_ERROR } from '@platform/constants/tenant';
import type { TTenantDetailsFieldError } from '@platform/server/tenants/tenant-field-error';
import { useTranslations } from 'next-intl';

const FIELD_ERROR_KEYS = {
  [TENANT_FIELD_ERROR.NAME_REQUIRED]: 'nameRequired',
  [TENANT_FIELD_ERROR.DOMAIN_INVALID]: 'domainInvalid',
  [TENANT_FIELD_ERROR.DOMAIN_TAKEN]: 'domainTaken',
  [TENANT_FIELD_ERROR.DOMAIN_ATTACHED_ELSEWHERE]: 'domainAttachedElsewhere',
  [TENANT_FIELD_ERROR.SLUG_INVALID]: 'slugInvalid',
  [TENANT_FIELD_ERROR.SLUG_RESERVED]: 'slugReserved',
  [TENANT_FIELD_ERROR.SLUG_TAKEN]: 'slugTaken',
  [TENANT_FIELD_ERROR.EMAIL_INVALID]: 'emailInvalid',
  [TENANT_FIELD_ERROR.LOCALE_UNSUPPORTED]: 'localeUnsupported',
  [TENANT_FIELD_ERROR.PLAN_UNSUPPORTED]: 'planUnsupported',
  [TENANT_FIELD_ERROR.OWNER_EMAIL_TAKEN]: 'ownerEmailTaken',
} satisfies Record<
  Exclude<TTenantDetailsFieldError, typeof TENANT_FIELD_ERROR.DOMAIN_LOCKED>,
  string
>;

export const useTenantFieldErrorText = () => {
  const t = useTranslations('tenantFieldErrors');
  const tPanel = useTranslations('tenantDetailsPanel');
  const tSteps = useTranslations('provisioningStatusView');

  return (
    error: TMaybeUndefined<TReasonedFailure<TTenantDetailsFieldError>>,
  ): TMaybeUndefined<string> => {
    if (!error) return undefined;
    const { reason, values } = error;
    if (reason !== TENANT_FIELD_ERROR.DOMAIN_LOCKED) {
      return t(FIELD_ERROR_KEYS[reason]);
    }
    const step = Object.values(TENANT_PROVISIONING_STEP).find(
      (candidate) => candidate === values?.step,
    );
    return tPanel('fieldLockedReasonStep', {
      step: step ? tSteps(`stepLabel.${step}`) : String(values?.step),
    });
  };
};
