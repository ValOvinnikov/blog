import {
  LOCALE_ISO_CODES,
  PRESET_ID,
  PRESET_REGISTRY,
  SITE_TYPE,
} from '@blog/config';
import { OnboardingView } from '@platform/components/features/onboarding/onboarding-view/onboarding-view';
import {
  ONBOARDING_STEP,
  ONBOARDING_TIER_QUERY,
  type TOnboardingStep,
} from '@platform/constants/onboarding';
import messages from '@platform/i18n/messages/en.json';
import { createSiteAction } from '@platform/server/onboarding/create-site-action';
import {
  ARIA_VALUEMAX,
  ARIA_VALUENOW,
  ARIA_VALUETEXT,
} from '@platform/testing/aria';
import { MOCK_SIGN_IN_EMAIL } from '@platform/testing/auth/fixtures';
import { customRender, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { stubChangingMediaQueries } from '@platform/testing/match-media';
import {
  MOCK_TENANT_NAME,
  MOCK_TENANT_ROOT_DOMAIN,
  MOCK_TENANT_SLUG,
} from '@platform/testing/tenants/fixtures';
import { toLegalPageUrls } from '@platform/utils/legal-page-urls/legal-page-urls';
import type { UserEvent } from '@testing-library/user-event';

export const createSiteMock = vi.mocked(createSiteAction);
export const MOCK_SITE_ADDRESS = `${MOCK_TENANT_SLUG}.${MOCK_TENANT_ROOT_DOMAIN}`;
const {
  nameLabel: NAME_LABEL,
  previewAddressPlaceholder: PLACEHOLDER_SLUG,
  createSite: CREATE_SITE,
  continue: CONTINUE,
  back: BACK,
  siteTypeLabel: SITE_TYPE_LABEL,
} = messages.onboardingForm;
export const {
  nameHint: NAME_HINT,
  siteTypeHint: SITE_TYPE_HINT,
  siteAddressLabel: SITE_ADDRESS_LABEL,
  siteAddressHint: SITE_ADDRESS_HINT,
  languageLabel: LANGUAGE_LABEL,
  languageHint: LANGUAGE_HINT,
  siteAddressChecking: ADDRESS_CHECKING,
  siteAddressUnverified: ADDRESS_UNVERIFIED,
  accentLabel: ACCENT_LABEL,
  siteTypes: SITE_TYPES,
  steps: STEPS,
  stepsAriaLabel: STEPS_ARIA_LABEL,
  fieldErrors: { nameRequired: NAME_REQUIRED, siteAddressTaken: ADDRESS_TAKEN },
  failures: { tryAgainLater: TRY_AGAIN_LATER },
} = messages.onboardingForm;
export const { console: CONSOLE_PRESET, editorial: EDITORIAL_PRESET } =
  messages.presetPicker;
const { acceptTerms: ACCEPT_TERMS } = messages.termsAcceptance;
export const { termsNotAccepted: TERMS_NOT_ACCEPTED } =
  messages.termsAcceptance;
const [ACCEPT_TERMS_LEAD] = ACCEPT_TERMS.split('<');
export const t = makeEnTranslator('onboardingForm');
const STEP_ORDER = Object.values(ONBOARDING_STEP);

export const MOCK_NAME_FIELD = { name: NAME_LABEL };
export const MOCK_ADDRESS_FIELD = { name: SITE_ADDRESS_LABEL };
export const MOCK_ACCEPTANCE = { name: new RegExp(`^${ACCEPT_TERMS_LEAD}`) };
export const MOCK_CREATE = { name: CREATE_SITE };
export const MOCK_CONTINUE = { name: CONTINUE };
export const MOCK_BACK = { name: BACK };
export const MOCK_ADDRESS_AVAILABLE = t('siteAddressAvailable', {
  address: MOCK_SITE_ADDRESS,
});
export const MOCK_PLACEHOLDER_ADDRESS = `${PLACEHOLDER_SLUG}.${MOCK_TENANT_ROOT_DOMAIN}`;
export const MOCK_LIVE_PREVIEW = {
  name: messages.previewModeControl.livePreviewHeading,
};
export const MOCK_SITE_TYPE_SELECT = { name: SITE_TYPE_LABEL };
const MOCK_EDIT_SITE_TYPE = {
  name: t('editField', { field: SITE_TYPE_LABEL }),
};
export const MOCK_EDITORIAL_LOOK = {
  preset: PRESET_ID.EDITORIAL,
  accentHue: PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens.accentHue,
};
export const MOCK_CONSOLE_LOOK = {
  preset: PRESET_ID.CONSOLE,
  accentHue: PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens.accentHue,
};

export const MOCK_CREATE_SITE_INPUT = {
  siteType: SITE_TYPE.BLOG,
  name: MOCK_TENANT_NAME,
  slug: MOCK_TENANT_SLUG,
  locale: LOCALE_ISO_CODES.EN,
  ...MOCK_EDITORIAL_LOOK,
  hasAcceptedTerms: true,
};

export const setup = customRender(OnboardingView, {
  rootDomain: MOCK_TENANT_ROOT_DOMAIN,
  legalPageUrls: toLegalPageUrls(MOCK_TENANT_ROOT_DOMAIN),
  initialLocale: LOCALE_ISO_CODES.EN,
  accountEmail: MOCK_SIGN_IN_EMAIL,
});

export const stepHeading = (name: string) =>
  screen.getByRole('heading', { level: 1, name });

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
    ARIA_VALUENOW,
    String(STEP_ORDER.indexOf(step) + 1),
  );
  expect(progressBar).toHaveAttribute(ARIA_VALUEMAX, String(STEP_ORDER.length));
  expect(progressBar).toHaveAttribute(ARIA_VALUETEXT, stepProgressText(step));
};

export const clickContinue = async (user: UserEvent) => {
  const continueButton = screen.getByRole('button', MOCK_CONTINUE);
  await user.click(continueButton);
};

export const pickSiteType = async (user: UserEvent, name: string) => {
  const siteTypeSelect = screen.getByRole('combobox', MOCK_SITE_TYPE_SELECT);
  await user.click(siteTypeSelect);
  const option = await screen.findByRole('option', { name });
  await user.click(option);
};

export const changeSiteTypeFromReview = async (
  user: UserEvent,
  name: string,
) => {
  const editSiteType = screen.getByRole('button', MOCK_EDIT_SITE_TYPE);
  await user.click(editSiteType);
  await pickSiteType(user, name);
  await clickContinue(user);
};

export const completeSiteStep = async (user: UserEvent) => {
  const nameField = screen.getByRole('textbox', MOCK_NAME_FIELD);
  await user.click(nameField);
  await user.paste(MOCK_TENANT_NAME);
  await clickContinue(user);
};

export const typeAddress = async (user: UserEvent) => {
  const addressField = screen.getByRole('textbox', MOCK_ADDRESS_FIELD);
  await user.click(addressField);
  await user.paste(MOCK_TENANT_SLUG);
  return addressField;
};

export const completeAddressStep = async (user: UserEvent) => {
  await typeAddress(user);
  await screen.findByText(MOCK_ADDRESS_AVAILABLE);
  await clickContinue(user);
};

export const reachReview = async (user: UserEvent) => {
  await completeSiteStep(user);
  await completeAddressStep(user);
  await clickContinue(user);
};

export const clickBack = async (user: UserEvent) => {
  const backButton = screen.getByRole('button', MOCK_BACK);
  await user.click(backButton);
};

export const editFromReview = async (user: UserEvent, field: string) => {
  const editButton = screen.getByRole('button', {
    name: t('editField', { field }),
  });
  await user.click(editButton);
};

export const clickCreate = async (user: UserEvent) => {
  const createButton = screen.getByRole('button', MOCK_CREATE);
  await user.click(createButton);
};

export const acceptAndCreate = async (user: UserEvent) => {
  const acceptance = screen.getByRole('checkbox', MOCK_ACCEPTANCE);
  await user.click(acceptance);
  await clickCreate(user);
};

export const returnToReviewAfterEditingName = async (user: UserEvent) => {
  await editFromReview(user, NAME_LABEL);
  await clickContinue(user);
};

export const createAfterChangingSiteType = async (
  user: UserEvent,
  name: string,
) => {
  await changeSiteTypeFromReview(user, name);
  await acceptAndCreate(user);
};

export const FULL_TIER = [
  ONBOARDING_TIER_QUERY.RAIL,
  ONBOARDING_TIER_QUERY.FULL,
];
export const RAIL_TIER = [ONBOARDING_TIER_QUERY.RAIL];
export const FULL_TIER_TITLE = 'from 1360px';
export const RAIL_TIER_TITLE = 'from 768px';

export const renderInTier = (matchingQueries: readonly string[]) => {
  const resizeTo = stubChangingMediaQueries(matchingQueries);
  setup();
  return resizeTo;
};
