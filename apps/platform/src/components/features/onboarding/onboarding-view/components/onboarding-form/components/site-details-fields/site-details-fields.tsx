'use client';

import { toOptions } from '@blog/utils/primitives';
import { useFieldErrorText } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/use-field-error-text';
import type { TOnboardingFieldErrors } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/use-onboarding-form';
import { FormField } from '@platform/components/shared/form-field';
import { OptionSelect } from '@platform/components/shared/option-select';
import { TextInput } from '@platform/components/shared/text-input';
import { FIELD_APPEARANCE } from '@platform/constants/field-appearance';
import {
  SELF_SERVE_SITE_TYPE,
  type TSelfServeSiteType,
} from '@platform/constants/onboarding';
import type { TCreateSiteInput } from '@platform/server/onboarding/create-site-input';
import { useTranslations } from 'next-intl';

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
    <>
      <FormField
        label={t('siteTypeLabel')}
        hint={t('siteTypeHint')}
        control={{ appearance: FIELD_APPEARANCE.WIZARD }}
      >
        <OptionSelect
          options={toOptions(SELF_SERVE_SITE_TYPE, (siteType) =>
            t(`siteTypes.${siteType}`),
          )}
          value={values.siteType}
          onChange={onSiteTypeChange}
          appearance={FIELD_APPEARANCE.WIZARD}
        />
      </FormField>
      <FormField
        label={t('nameLabel')}
        hint={t('nameHint')}
        error={nameError && errorText(nameError)}
        control={{ appearance: FIELD_APPEARANCE.WIZARD }}
      >
        <TextInput
          value={values.name}
          onChange={(name) => onFieldChange({ name })}
        />
      </FormField>
    </>
  );
};
