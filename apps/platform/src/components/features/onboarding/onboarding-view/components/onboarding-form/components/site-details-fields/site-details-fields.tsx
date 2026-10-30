'use client';

import { useFieldErrorText } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/use-field-error-text';
import type { TOnboardingFieldErrors } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/use-onboarding-form';
import { FormField } from '@platform/components/shared/form-field';
import { FormTextInput } from '@platform/components/shared/form-text-input';
import { OptionSelect } from '@platform/components/shared/option-select';
import {
  SELF_SERVE_SITE_TYPES,
  type TSelfServeSiteType,
} from '@platform/constants/onboarding';
import type { TCreateSiteInput } from '@platform/server/onboarding/create-site-input';
import { useTranslations } from 'next-intl';

import { siteDetailsFieldsVariants } from './site-details-fields-variants';

export type TSiteDetailsFieldsProps = {
  values: TCreateSiteInput;
  fieldErrors: TOnboardingFieldErrors;
  onFieldChange: (patch: Partial<TCreateSiteInput>) => void;
  onSiteTypeChange: (siteType: TSelfServeSiteType) => void;
};

export const SiteDetailsFields = ({
  values,
  fieldErrors,
  onFieldChange,
  onSiteTypeChange,
}: TSiteDetailsFieldsProps) => {
  const t = useTranslations('onboardingForm');
  const errorText = useFieldErrorText();
  const nameError = fieldErrors.name?.reason;

  return (
    <div className={siteDetailsFieldsVariants()}>
      <FormField label={t('siteTypeLabel')} hint={t('siteTypeHint')}>
        <OptionSelect
          options={SELF_SERVE_SITE_TYPES.map((siteType) => ({
            value: siteType,
            label: t(`siteTypes.${siteType}`),
          }))}
          value={values.siteType}
          onChange={onSiteTypeChange}
        />
      </FormField>
      <FormTextInput
        label={t('nameLabel')}
        hint={t('nameHint')}
        error={nameError && errorText(nameError)}
        value={values.name}
        onChange={(name) => onFieldChange({ name })}
      />
    </div>
  );
};
