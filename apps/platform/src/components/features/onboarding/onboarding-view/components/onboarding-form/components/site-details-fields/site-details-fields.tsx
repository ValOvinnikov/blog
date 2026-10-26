'use client';

import {
  LOCALE_ISO_CODES,
  type TFieldErrors,
  type TMaybeUndefined,
} from '@blog/config';
import { SiteAddressField } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/components/site-address-field';
import { ONBOARDING_FIELD_ERROR_KEYS } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/onboarding-error-keys';
import { FormField } from '@platform/components/shared/form-field';
import { FormTextInput } from '@platform/components/shared/form-text-input';
import { OptionSelect } from '@platform/components/shared/option-select';
import { SELF_SERVE_SITE_TYPES } from '@platform/constants/onboarding';
import type {
  TCreateSiteFieldError,
  TCreateSiteInput,
} from '@platform/server/onboarding/create-site-input';
import { useTranslations } from 'next-intl';

export type TSiteDetailsFieldsProps = {
  values: TCreateSiteInput;
  fieldErrors: TFieldErrors<keyof TCreateSiteInput, TCreateSiteFieldError>;
  rootDomain: TMaybeUndefined<string>;
  onFieldChange: (patch: Partial<TCreateSiteInput>) => void;
};

export const SiteDetailsFields = ({
  values,
  fieldErrors,
  rootDomain,
  onFieldChange,
}: TSiteDetailsFieldsProps) => {
  const t = useTranslations('onboardingForm');
  const tLanguage = useTranslations('languageNames');
  const errorText = (reason: TCreateSiteFieldError) =>
    t(`fieldErrors.${ONBOARDING_FIELD_ERROR_KEYS[reason]}`);
  const nameError = fieldErrors.name?.reason;

  return (
    <>
      <FormField label={t('siteTypeLabel')} hint={t('siteTypeHint')}>
        <OptionSelect
          options={SELF_SERVE_SITE_TYPES.map((siteType) => ({
            value: siteType,
            label: t(`siteTypes.${siteType}`),
          }))}
          value={values.siteType}
          onChange={(siteType) => onFieldChange({ siteType })}
        />
      </FormField>
      <FormTextInput
        label={t('nameLabel')}
        hint={t('nameHint')}
        error={nameError && errorText(nameError)}
        value={values.name}
        onChange={(name) => onFieldChange({ name })}
      />
      <SiteAddressField
        value={values.slug}
        onChange={(slug) => onFieldChange({ slug })}
        rootDomain={rootDomain}
        submittedError={fieldErrors.slug?.reason}
        toErrorText={errorText}
      />
      <FormField label={t('languageLabel')} hint={t('languageHint')}>
        <OptionSelect
          options={Object.values(LOCALE_ISO_CODES).map((locale) => ({
            value: locale,
            label: tLanguage(locale),
          }))}
          value={values.locale}
          onChange={(locale) => onFieldChange({ locale })}
        />
      </FormField>
    </>
  );
};
