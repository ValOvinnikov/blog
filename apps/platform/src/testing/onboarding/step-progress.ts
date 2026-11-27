import { ARIA_ATTRIBUTE } from '@platform/constants/aria-attribute';
import {
  ONBOARDING_STEP,
  type TOnboardingStep,
} from '@platform/constants/onboarding';
import messages from '@platform/i18n/messages/en.json';
import { screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';

const { steps: STEPS, stepsAriaLabel: STEPS_ARIA_LABEL } =
  messages.onboardingForm;
const t = makeEnTranslator('onboardingForm');
const STEP_ORDER = Object.values(ONBOARDING_STEP);

const stepProgress = () =>
  screen.getByRole('progressbar', { name: STEPS_ARIA_LABEL });

export const stepProgressText = (step: TOnboardingStep) =>
  t('stepProgressNamed', {
    n: STEP_ORDER.indexOf(step) + 1,
    total: STEP_ORDER.length,
    step: STEPS[step],
  });

export const expectProgressAt = (step: TOnboardingStep) => {
  const progressBar = stepProgress();

  expect(progressBar).toHaveAttribute(
    ARIA_ATTRIBUTE.VALUENOW,
    String(STEP_ORDER.indexOf(step) + 1),
  );
  expect(progressBar).toHaveAttribute(
    ARIA_ATTRIBUTE.VALUEMAX,
    String(STEP_ORDER.length),
  );
  expect(progressBar).toHaveAttribute(
    ARIA_ATTRIBUTE.VALUETEXT,
    stepProgressText(step),
  );
};
