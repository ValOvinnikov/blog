'use client';

import { LockableSegmentedField } from '@platform/components/features/tenants/tenant-details-panel/components/lockable-segmented-field';
import type {
  TTenantDetailsFieldErrors,
  TTenantDetailsValues,
} from '@platform/components/features/tenants/tenant-details-panel/tenant-details-values';
import { FormField } from '@platform/components/shared/form-field';
import { TextInput } from '@platform/components/shared/text-input';
import type { TTenantFieldLocks } from '@platform/utils/tenant-field-locks/tenant-field-locks';
import { usePlanOptions } from '@platform/utils/use-plan-options/use-plan-options';
import { useTenantFieldErrorText } from '@platform/utils/use-tenant-field-error-text/use-tenant-field-error-text';
import { LOCALE_ISO_CODES } from '@shinefold/config';
import { toOptions } from '@shinefold/utils/primitives';
import { useTranslations } from 'next-intl';

import { tenantDetailsFieldsVariants } from './tenant-details-fields-variants';
import { useLockReasonText } from './use-lock-reason-text';

export type TTenantDetailsFieldsProps = {
  values: TTenantDetailsValues;
  fieldLocks: TTenantFieldLocks;
  fieldErrors: TTenantDetailsFieldErrors;
  onChange: <K extends keyof TTenantDetailsValues>(
    key: K,
    nextValue: TTenantDetailsValues[K],
  ) => void;
};

const TEXT_FIELDS = [
  { key: 'name', labelKey: 'nameLabel' },
  { key: 'primaryDomain', labelKey: 'domainLabel' },
  { key: 'ownerEmail', labelKey: 'ownerEmailLabel', type: 'email' },
] as const;

export const TenantDetailsFields = ({
  values,
  fieldLocks,
  fieldErrors,
  onChange,
}: TTenantDetailsFieldsProps) => {
  const t = useTranslations('tenantDetailsPanel');
  const tLanguage = useTranslations('languageNames');
  const fieldErrorText = useTenantFieldErrorText();
  const lockReasonText = useLockReasonText();
  const { wideField } = tenantDetailsFieldsVariants();

  const planOptions = usePlanOptions();

  const localeOptions = toOptions(LOCALE_ISO_CODES, (locale) =>
    tLanguage(locale),
  );

  return (
    <>
      {TEXT_FIELDS.map((field) => {
        const { key, labelKey } = field;
        const lockReason = lockReasonText(fieldLocks[key]);

        return (
          <FormField
            key={key}
            label={t(labelKey)}
            hint={lockReason}
            error={fieldErrorText(fieldErrors[key])}
            control={{ isLocked: Boolean(lockReason) }}
          >
            <TextInput
              type={'type' in field ? field.type : undefined}
              value={values[key]}
              onChange={(nextValue) => onChange(key, nextValue)}
            />
          </FormField>
        );
      })}

      <div className={wideField()}>
        <LockableSegmentedField
          label={t('localeLabel')}
          options={localeOptions}
          value={values.locale}
          onChange={(locale) => onChange('locale', locale)}
          lockReason={lockReasonText(fieldLocks.locale)}
        />
      </div>

      <LockableSegmentedField
        label={t('planLabel')}
        options={planOptions}
        value={values.plan}
        // eslint-disable-next-line shinefold-touched/prefer-shared-constant -- a form field key, not BADGE_TONE.PLAN
        onChange={(plan) => onChange('plan', plan)}
        lockReason={lockReasonText(fieldLocks.plan)}
      />
    </>
  );
};
