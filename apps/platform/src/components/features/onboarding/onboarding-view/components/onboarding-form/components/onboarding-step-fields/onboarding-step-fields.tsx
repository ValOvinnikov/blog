import { AddressStepFields } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/components/address-step-fields';
import { ReviewStep } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/components/review-step';
import { SiteDetailsFields } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/components/site-details-fields';
import { SiteLookFields } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/components/site-look-fields';
import type { useOnboardingWizard } from '@platform/components/features/onboarding/onboarding-view/components/onboarding-form/use-onboarding-wizard';
import { ONBOARDING_STEP } from '@platform/constants/onboarding';
import type { TLegalPageUrls } from '@platform/utils/legal-page-urls/legal-page-urls';
import type { TMaybeUndefined } from '@shinefold/config';

export type TOnboardingStepFieldsProps = Pick<
  ReturnType<typeof useOnboardingWizard>,
  | 'step'
  | 'values'
  | 'fieldErrors'
  | 'addressVerdict'
  | 'siteAddress'
  | 'changeField'
  | 'changeSiteType'
  | 'changePreset'
  | 'changeAccentHue'
  | 'editStep'
> & {
  rootDomain: TMaybeUndefined<string>;
  legalPageUrls: TMaybeUndefined<TLegalPageUrls>;
};

export const OnboardingStepFields = ({
  step,
  values,
  fieldErrors,
  addressVerdict,
  siteAddress,
  changeField,
  changeSiteType,
  changePreset,
  changeAccentHue,
  editStep,
  rootDomain,
  legalPageUrls,
}: TOnboardingStepFieldsProps) => (
  <>
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
        addressVerdict={addressVerdict}
        onFieldChange={changeField}
      />
    )}
    {step === ONBOARDING_STEP.LOOK && (
      <SiteLookFields
        preset={values.preset}
        accentHue={values.accentHue}
        accentHueError={fieldErrors.accentHue?.reason}
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
  </>
);
