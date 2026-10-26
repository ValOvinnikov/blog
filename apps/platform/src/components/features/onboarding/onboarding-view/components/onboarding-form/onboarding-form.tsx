'use client';

import { Form } from '@base-ui/react/form';
import {
  ALERT_TYPE,
  type TLocaleIsoCode,
  type TMaybeUndefined,
} from '@blog/config';
import { OnboardingPreview } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/components/onboarding-preview';
import { SiteDetailsFields } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/components/site-details-fields';
import { SiteLookFields } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/components/site-look-fields';
import { TermsAcceptanceCheckbox } from '@platform/components/features/sign-up/terms-acceptance-checkbox';
import { Alert } from '@platform/components/shared/alert';
import { Button } from '@platform/components/shared/button';
import type { TLegalPageUrls } from '@platform/utils/legal-page-urls/legal-page-urls';
import { useTranslations } from 'next-intl';
import type { FormEvent } from 'react';

import { ONBOARDING_FAILURE_KEYS } from './onboarding-error-keys';
import { onboardingFormVariants } from './onboarding-form-variants';
import { useOnboardingForm } from './use-onboarding-form';

export type TOnboardingFormProps = {
  rootDomain: TMaybeUndefined<string>;
  legalPageUrls: TMaybeUndefined<TLegalPageUrls>;
  initialLocale: TLocaleIsoCode;
};

export const OnboardingForm = ({
  rootDomain,
  legalPageUrls,
  initialLocale,
}: TOnboardingFormProps) => {
  const t = useTranslations('onboardingForm');
  const {
    values,
    fieldErrors,
    failure,
    isPending,
    changeField,
    changePreset,
    submit,
  } = useOnboardingForm(initialLocale);
  const {
    root,
    fields,
    preview,
    submit: submitSlot,
  } = onboardingFormVariants();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  return (
    <div className={root()}>
      <Form className={fields()} onSubmit={handleSubmit}>
        {failure && (
          <Alert
            type={ALERT_TYPE.ERROR}
            title={t('failureTitle')}
            description={t(`failures.${ONBOARDING_FAILURE_KEYS[failure]}`)}
          />
        )}
        <SiteDetailsFields
          values={values}
          fieldErrors={fieldErrors}
          rootDomain={rootDomain}
          onFieldChange={changeField}
        />
        <SiteLookFields
          preset={values.preset}
          accentHue={values.accentHue}
          onPresetChange={changePreset}
          onAccentHueChange={(accentHue) => changeField({ accentHue })}
        />
        <TermsAcceptanceCheckbox
          legalPageUrls={legalPageUrls}
          isChecked={values.hasAcceptedTerms}
          onCheckedChange={(hasAcceptedTerms) =>
            changeField({ hasAcceptedTerms })
          }
          hasError={Boolean(fieldErrors.hasAcceptedTerms)}
        />
        <Button
          type="submit"
          variant="primary"
          isPending={isPending}
          pendingLabel={t('creating')}
          className={submitSlot()}
        >
          {t('createSite')}
        </Button>
      </Form>
      <div className={preview()}>
        <OnboardingPreview
          name={values.name}
          locale={values.locale}
          preset={values.preset}
          accentHue={values.accentHue}
        />
      </div>
    </div>
  );
};
