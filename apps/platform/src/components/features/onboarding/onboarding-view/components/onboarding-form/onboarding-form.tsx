'use client';

import { Form } from '@base-ui/react/form';
import {
  ALERT_TYPE,
  type TLocaleIsoCode,
  type TMaybeUndefined,
} from '@blog/config';
import { AddressStepFields } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/components/address-step-fields';
import { AddressVerdict } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/components/address-verdict';
import { OnboardingActions } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/components/onboarding-actions';
import { OnboardingPreview } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/components/onboarding-preview';
import { OnboardingRail } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/components/onboarding-rail';
import { OnboardingStepHeader } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/components/onboarding-step-header';
import { ReviewStep } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/components/review-step';
import { SiteDetailsFields } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/components/site-details-fields';
import { SiteLookFields } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/components/site-look-fields';
import { Alert } from '@platform/components/shared/alert';
import { Card } from '@platform/components/shared/card';
import { ONBOARDING_STEP } from '@platform/constants/onboarding';
import type { TLegalPageUrls } from '@platform/utils/legal-page-urls/legal-page-urls';
import { useTranslations } from 'next-intl';

import { ONBOARDING_FAILURE_KEYS } from './onboarding-error-keys';
import { onboardingFormVariants } from './onboarding-form-variants';
import { useOnboardingWizard } from './use-onboarding-wizard';

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
    step,
    stepIndex,
    isFirstStep,
    isLastStep,
    isContinueDisabled,
    panelRef,
    addressVerdict,
    addressErrorId,
    siteAddress,
    previewAddress,
    railSteps,
    changeField,
    changeSiteType,
    changePreset,
    changeAccentHue,
    editStep,
    goNext,
    goBack,
    handleSubmit,
  } = useOnboardingWizard(initialLocale, rootDomain);
  const { root, main, form, panel, fields, preview, actions } =
    onboardingFormVariants();

  return (
    <div className={root()}>
      <OnboardingRail steps={railSteps} currentIndex={stepIndex} />
      <main className={main()}>
        <Form className={form()} onSubmit={handleSubmit}>
          <Card className={panel()}>
            <Card.Body>
              <div ref={panelRef} tabIndex={-1} className={fields()}>
                <OnboardingStepHeader
                  step={step}
                  stepNumber={stepIndex + 1}
                  stepTotal={railSteps.length}
                />
                {failure && (
                  <Alert
                    type={ALERT_TYPE.ERROR}
                    title={t('failureTitle')}
                    description={t(
                      `failures.${ONBOARDING_FAILURE_KEYS[failure]}`,
                    )}
                  />
                )}
                {step === ONBOARDING_STEP.SITE && (
                  <SiteDetailsFields
                    values={values}
                    fieldErrors={fieldErrors}
                    onFieldChange={changeField}
                    onSiteTypeChange={changeSiteType}
                  />
                )}
                {step === ONBOARDING_STEP.ADDRESS && (
                  <AddressStepFields
                    values={values}
                    rootDomain={rootDomain}
                    addressErrorId={addressErrorId}
                    onFieldChange={changeField}
                  />
                )}
                {step === ONBOARDING_STEP.LOOK && (
                  <SiteLookFields
                    preset={values.preset}
                    accentHue={values.accentHue}
                    onPresetChange={changePreset}
                    onAccentHueChange={changeAccentHue}
                  />
                )}
                {step === ONBOARDING_STEP.REVIEW && (
                  <ReviewStep
                    values={values}
                    siteAddress={siteAddress}
                    legalPageUrls={legalPageUrls}
                    hasTermsError={Boolean(fieldErrors.hasAcceptedTerms)}
                    onFieldChange={changeField}
                    onEdit={editStep}
                  />
                )}
              </div>
            </Card.Body>
          </Card>
          <div className={actions()}>
            <OnboardingActions
              isFirstStep={isFirstStep}
              isLastStep={isLastStep}
              isPending={isPending}
              isContinueDisabled={isContinueDisabled}
              onBack={goBack}
              onContinue={goNext}
            >
              {step === ONBOARDING_STEP.ADDRESS && (
                <AddressVerdict verdict={addressVerdict} />
              )}
            </OnboardingActions>
          </div>
          <div className={preview()}>
            <OnboardingPreview
              name={values.name}
              siteAddress={previewAddress}
              locale={values.locale}
              preset={values.preset}
              accentHue={values.accentHue}
            />
          </div>
        </Form>
      </main>
    </div>
  );
};
