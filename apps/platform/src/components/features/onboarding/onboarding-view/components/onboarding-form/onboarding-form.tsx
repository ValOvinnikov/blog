'use client';

import { Form } from '@base-ui/react/form';
import type { TLocaleIsoCode, TMaybeUndefined } from '@blog/config';
import { AddressVerdict } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/components/address-verdict';
import { OnboardingActions } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/components/onboarding-actions';
import { OnboardingFailureAlert } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/components/onboarding-failure-alert';
import { OnboardingPreview } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/components/onboarding-preview';
import { OnboardingRail } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/components/onboarding-rail';
import { OnboardingStepFields } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/components/onboarding-step-fields';
import { OnboardingStepHeader } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/components/onboarding-step-header';
import {
  ONBOARDING_SCROLL_AREA_TEST_ID,
  ONBOARDING_STEP,
} from '@platform/constants/onboarding';
import type { TLegalPageUrls } from '@platform/utils/legal-page-urls/legal-page-urls';

import { onboardingFormVariants } from './onboarding-form-variants';
import { useOnboardingTier } from './use-onboarding-tier';
import { useOnboardingWizard } from './use-onboarding-wizard';

export type TOnboardingFormProps = {
  rootDomain: TMaybeUndefined<string>;
  legalPageUrls: TMaybeUndefined<TLegalPageUrls>;
  initialLocale: TLocaleIsoCode;
  accountEmail: TMaybeUndefined<string>;
};

export const OnboardingForm = ({
  rootDomain,
  legalPageUrls,
  initialLocale,
  accountEmail,
}: TOnboardingFormProps) => {
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
  const { isPhone, isRail, isFull } = useOnboardingTier();
  const {
    root,
    form,
    main,
    scrollArea,
    column,
    panel,
    fields,
    railPreview,
    previewColumn,
    phonePreview,
    actions,
  } = onboardingFormVariants();

  const preview = (
    <OnboardingPreview
      name={values.name}
      siteAddress={previewAddress}
      locale={values.locale}
      preset={values.preset}
      accentHue={values.accentHue}
    />
  );

  const footer = (
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
  );

  return (
    <div className={root()}>
      <OnboardingRail
        steps={railSteps}
        currentIndex={stepIndex}
        accountEmail={accountEmail}
      />
      <Form className={form()} onSubmit={handleSubmit}>
        <main className={main()}>
          <div
            className={scrollArea()}
            data-testid={ONBOARDING_SCROLL_AREA_TEST_ID}
          >
            <div className={column()}>
              <div ref={panelRef} tabIndex={-1} className={panel()}>
                <OnboardingStepHeader
                  step={step}
                  stepNumber={stepIndex + 1}
                  stepTotal={railSteps.length}
                />
                <div className={fields()}>
                  {failure && <OnboardingFailureAlert failure={failure} />}
                  <OnboardingStepFields
                    step={step}
                    values={values}
                    fieldErrors={fieldErrors}
                    addressErrorId={addressErrorId}
                    siteAddress={siteAddress}
                    changeField={changeField}
                    changeSiteType={changeSiteType}
                    changePreset={changePreset}
                    changeAccentHue={changeAccentHue}
                    editStep={editStep}
                    rootDomain={rootDomain}
                    legalPageUrls={legalPageUrls}
                  />
                </div>
              </div>
              {isRail && <div className={railPreview()}>{preview}</div>}
            </div>
          </div>
          {!isPhone && footer}
        </main>
        {isFull && <div className={previewColumn()}>{preview}</div>}
        {isPhone && <div className={phonePreview()}>{preview}</div>}
        {isPhone && footer}
      </Form>
    </div>
  );
};
