import {
  ACTION_OUTCOME,
  LOCALE_ISO_CODES,
  PRESET_ID,
  PRESET_REGISTRY,
  SITE_TYPE,
} from '@blog/config';
import { faker } from '@faker-js/faker';
import {
  ONBOARDING_SCROLL_AREA_TEST_ID,
  ONBOARDING_STEP,
  ONBOARDING_TIER_QUERY,
  type TOnboardingStep,
} from '@platform/constants/onboarding';
import {
  PREVIEW_DEVICE,
  PREVIEW_DEVICE_WIDTH,
  type TPreviewDevice,
} from '@platform/constants/preview';
import {
  SIGN_UP_FIELD_ERROR,
  SIGN_UP_REFUSAL,
} from '@platform/constants/sign-up';
import { TENANT_FIELD_ERROR } from '@platform/constants/tenant';
import messages from '@platform/i18n/messages/en.json';
import { checkSiteAddressAction } from '@platform/server/onboarding/check-site-address-action';
import { createSiteAction } from '@platform/server/onboarding/create-site-action';
import {
  ARIA_PRESSED,
  ARIA_VALUEMAX,
  ARIA_VALUENOW,
  ARIA_VALUETEXT,
} from '@platform/testing/aria';
import { MOCK_SIGN_IN_EMAIL } from '@platform/testing/auth/fixtures';
import {
  act,
  customRender,
  isInaccessible,
  screen,
  within,
} from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { stubResizeObserver } from '@platform/testing/resize-observer';
import {
  MOCK_TENANT_NAME,
  MOCK_TENANT_ROOT_DOMAIN,
} from '@platform/testing/tenants/fixtures';
import { toLegalPageUrls } from '@platform/utils/legal-page-urls/legal-page-urls';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { OnboardingView } from './onboarding-view';

vi.mock('@platform/server/onboarding/create-site-action', () => ({
  createSiteAction: vi.fn(),
}));

vi.mock('@platform/server/auth/sign-out-action');

vi.mock('@platform/server/onboarding/check-site-address-action', () => ({
  checkSiteAddressAction: vi.fn(),
}));

const createSiteMock = vi.mocked(createSiteAction);
const checkSiteAddressMock = vi.mocked(checkSiteAddressAction);

faker.seed(5994);

const MOCK_SLUG = faker.helpers.slugify(faker.lorem.words(2));
const MOCK_SITE_ADDRESS = `${MOCK_SLUG}.${MOCK_TENANT_ROOT_DOMAIN}`;
const {
  nameLabel: NAME_LABEL,
  nameHint: NAME_HINT,
  siteTypeHint: SITE_TYPE_HINT,
  siteAddressLabel: SITE_ADDRESS_LABEL,
  siteAddressHint: SITE_ADDRESS_HINT,
  languageLabel: LANGUAGE_LABEL,
  languageHint: LANGUAGE_HINT,
  siteAddressChecking: ADDRESS_CHECKING,
  siteAddressUnverified: ADDRESS_UNVERIFIED,
  previewAddressPlaceholder: PLACEHOLDER_SLUG,
  createSite: CREATE_SITE,
  continue: CONTINUE,
  back: BACK,
  siteTypeLabel: SITE_TYPE_LABEL,
  accentLabel: ACCENT_LABEL,
  siteTypes: SITE_TYPES,
  steps: STEPS,
  stepsAriaLabel: STEPS_ARIA_LABEL,
  fieldErrors: { nameRequired: NAME_REQUIRED, siteAddressTaken: ADDRESS_TAKEN },
  failures: { tryAgainLater: TRY_AGAIN_LATER },
} = messages.onboardingForm;
const { console: CONSOLE_PRESET, editorial: EDITORIAL_PRESET } =
  messages.presetPicker;
const { acceptTerms: ACCEPT_TERMS, termsNotAccepted: TERMS_NOT_ACCEPTED } =
  messages.termsAcceptance;
const [ACCEPT_TERMS_LEAD] = ACCEPT_TERMS.split('<');
const t = makeEnTranslator('onboardingForm');
const STEP_ORDER = Object.values(ONBOARDING_STEP);

const MOCK_NAME_FIELD = { name: NAME_LABEL };
const MOCK_ADDRESS_FIELD = { name: SITE_ADDRESS_LABEL };
const MOCK_ACCEPTANCE = { name: new RegExp(`^${ACCEPT_TERMS_LEAD}`) };
const MOCK_CREATE = { name: CREATE_SITE };
const MOCK_CONTINUE = { name: CONTINUE };
const MOCK_BACK = { name: BACK };
const MOCK_ADDRESS_AVAILABLE = t('siteAddressAvailable', {
  address: MOCK_SITE_ADDRESS,
});
const MOCK_PLACEHOLDER_ADDRESS = `${PLACEHOLDER_SLUG}.${MOCK_TENANT_ROOT_DOMAIN}`;
const MOCK_ANNOUNCED_PLACEHOLDER_ADDRESS = `${SITE_ADDRESS_LABEL} ${MOCK_PLACEHOLDER_ADDRESS}`;
const MOCK_ANNOUNCED_SITE_ADDRESS = `${SITE_ADDRESS_LABEL} ${MOCK_SITE_ADDRESS}`;
const MOCK_LIVE_PREVIEW = {
  name: messages.previewModeControl.livePreviewHeading,
};
const MOCK_SITE_TYPE_SELECT = { name: SITE_TYPE_LABEL };
const MOCK_EDIT_SITE_TYPE = {
  name: t('editField', { field: SITE_TYPE_LABEL }),
};
const MOCK_ACCENT_SLIDER = { name: ACCENT_LABEL };
const MOCK_EDITORIAL_LOOK = {
  preset: PRESET_ID.EDITORIAL,
  accentHue: PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens.accentHue,
};
const MOCK_CONSOLE_LOOK = {
  preset: PRESET_ID.CONSOLE,
  accentHue: PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens.accentHue,
};

const MOCK_TERMS_NOT_ACCEPTED_RESULT = {
  outcome: ACTION_OUTCOME.INVALID,
  fieldErrors: {
    hasAcceptedTerms: { reason: SIGN_UP_FIELD_ERROR.TERMS_NOT_ACCEPTED },
  },
} as const;

const MOCK_CREATE_SITE_INPUT = {
  siteType: SITE_TYPE.BLOG,
  name: MOCK_TENANT_NAME,
  slug: MOCK_SLUG,
  locale: LOCALE_ISO_CODES.EN,
  ...MOCK_EDITORIAL_LOOK,
  hasAcceptedTerms: true,
};

const setup = customRender(OnboardingView, {
  rootDomain: MOCK_TENANT_ROOT_DOMAIN,
  legalPageUrls: toLegalPageUrls(MOCK_TENANT_ROOT_DOMAIN),
  initialLocale: LOCALE_ISO_CODES.EN,
  accountEmail: MOCK_SIGN_IN_EMAIL,
});

let user: UserEvent;

const stepHeading = (name: string) =>
  screen.getByRole('heading', { level: 1, name });

const stepProgress = () =>
  screen.getByRole('progressbar', { name: STEPS_ARIA_LABEL });

const stepProgressText = (step: TOnboardingStep) =>
  t('stepProgressNamed', {
    n: STEP_ORDER.indexOf(step) + 1,
    total: STEP_ORDER.length,
    step: STEPS[step],
  });

const expectProgressAt = (step: TOnboardingStep) => {
  const progressBar = stepProgress();

  expect(progressBar).toHaveAttribute(
    ARIA_VALUENOW,
    String(STEP_ORDER.indexOf(step) + 1),
  );
  expect(progressBar).toHaveAttribute(ARIA_VALUEMAX, String(STEP_ORDER.length));
  expect(progressBar).toHaveAttribute(ARIA_VALUETEXT, stepProgressText(step));
};

const clickContinue = async () => {
  const continueButton = screen.getByRole('button', MOCK_CONTINUE);
  await user.click(continueButton);
};

const pickSiteType = async (name: string) => {
  const siteTypeSelect = screen.getByRole('combobox', MOCK_SITE_TYPE_SELECT);
  await user.click(siteTypeSelect);
  const option = await screen.findByRole('option', { name });
  await user.click(option);
};

const changeSiteTypeFromReview = async (name: string) => {
  const editSiteType = screen.getByRole('button', MOCK_EDIT_SITE_TYPE);
  await user.click(editSiteType);
  await pickSiteType(name);
  await clickContinue();
};

const completeSiteStep = async () => {
  const nameField = screen.getByRole('textbox', MOCK_NAME_FIELD);
  await user.type(nameField, MOCK_TENANT_NAME);
  await clickContinue();
};

const typeAddress = async () => {
  const addressField = screen.getByRole('textbox', MOCK_ADDRESS_FIELD);
  await user.type(addressField, MOCK_SLUG);
  return addressField;
};

const completeAddressStep = async () => {
  await typeAddress();
  await screen.findByText(MOCK_ADDRESS_AVAILABLE);
  await clickContinue();
};

const reachReview = async () => {
  await completeSiteStep();
  await completeAddressStep();
  await clickContinue();
};

const acceptAndCreate = async () => {
  const acceptance = screen.getByRole('checkbox', MOCK_ACCEPTANCE);
  await user.click(acceptance);
  const createButton = screen.getByRole('button', MOCK_CREATE);
  await user.click(createButton);
};

describe(`<${OnboardingView.name}/>`, () => {
  beforeEach(() => {
    user = userEvent.setup();
    checkSiteAddressMock.mockResolvedValue(undefined);
    createSiteMock.mockResolvedValue({ outcome: ACTION_OUTCOME.SUCCESS });
    setup();
  });

  it('names the signed-in email and offers a sign out', () => {
    const email = screen.getByText(MOCK_SIGN_IN_EMAIL, { exact: false });
    const signOutButton = screen.getByRole('button', {
      name: messages.account.signOut,
    });

    expect(email).toBeVisible();
    expect(signOutButton).toBeVisible();
  });

  it('creates the site from the values the user entered', async () => {
    await reachReview();
    await acceptAndCreate();

    expect(createSiteMock).toHaveBeenCalledWith(MOCK_CREATE_SITE_INPUT);
  });

  it('starts from the accent of the preset the user picks', async () => {
    await completeSiteStep();
    await completeAddressStep();
    const consolePreset = screen.getByRole('radio', { name: CONSOLE_PRESET });
    await user.click(consolePreset);
    await clickContinue();
    await acceptAndCreate();

    expect(createSiteMock).toHaveBeenCalledWith({
      ...MOCK_CREATE_SITE_INPUT,
      ...MOCK_CONSOLE_LOOK,
    });
  });

  it('creates the site type the user picks', async () => {
    await pickSiteType(SITE_TYPES.PORTFOLIO);
    await reachReview();
    await acceptAndCreate();

    expect(createSiteMock).toHaveBeenCalledWith({
      ...MOCK_CREATE_SITE_INPUT,
      siteType: SITE_TYPE.PORTFOLIO,
    });
  });

  it.each([SITE_TYPES.DOCS, SITE_TYPES.BLANK])(
    'starts a %s site on the Console preset',
    async (siteType) => {
      await reachReview();
      await changeSiteTypeFromReview(siteType);
      await acceptAndCreate();

      expect(createSiteMock).toHaveBeenCalledWith(
        expect.objectContaining(MOCK_CONSOLE_LOOK),
      );
    },
  );

  it('returns to the Editorial preset when switching back from Docs', async () => {
    await reachReview();
    await changeSiteTypeFromReview(SITE_TYPES.DOCS);
    await changeSiteTypeFromReview(SITE_TYPES.PERSONAL);
    await acceptAndCreate();

    expect(createSiteMock).toHaveBeenCalledWith(
      expect.objectContaining(MOCK_EDITORIAL_LOOK),
    );
  });

  it('keeps the preset the user picked when the site type changes', async () => {
    await completeSiteStep();
    await completeAddressStep();
    const consolePreset = screen.getByRole('radio', { name: CONSOLE_PRESET });
    await user.click(consolePreset);
    await clickContinue();
    await changeSiteTypeFromReview(SITE_TYPES.PORTFOLIO);
    await acceptAndCreate();

    expect(createSiteMock).toHaveBeenCalledWith(
      expect.objectContaining(MOCK_CONSOLE_LOOK),
    );
  });

  it('keeps the accent the user moved when the site type changes', async () => {
    await completeSiteStep();
    await completeAddressStep();
    const accentSlider = screen.getByRole('slider', MOCK_ACCENT_SLIDER);
    await user.click(accentSlider);
    await user.keyboard('{ArrowRight}');
    const movedHue = Number(accentSlider.getAttribute(ARIA_VALUENOW));
    await clickContinue();
    await changeSiteTypeFromReview(SITE_TYPES.DOCS);
    await acceptAndCreate();

    expect(movedHue).not.toBe(MOCK_EDITORIAL_LOOK.accentHue);
    expect(createSiteMock).toHaveBeenCalledWith(
      expect.objectContaining({
        preset: PRESET_ID.EDITORIAL,
        accentHue: movedHue,
      }),
    );
  });

  it('asks for a name before leaving the first step', async () => {
    await clickContinue();

    const message = screen.getByText(NAME_REQUIRED);
    const heading = stepHeading(STEPS.SITE);

    expect(message).toBeVisible();
    expect(heading).toBeVisible();
  });

  it('describes the site type and name by their hints', () => {
    const siteTypeSelect = screen.getByRole('combobox', MOCK_SITE_TYPE_SELECT);
    const nameField = screen.getByRole('textbox', MOCK_NAME_FIELD);

    expect(siteTypeSelect).toHaveAccessibleDescription(SITE_TYPE_HINT);
    expect(nameField).toHaveAccessibleDescription(NAME_HINT);
  });

  it('describes an empty name by its hint, then what is missing', async () => {
    await clickContinue();

    const nameField = screen.getByRole('textbox', MOCK_NAME_FIELD);

    expect(nameField).toBeInvalid();
    expect(nameField).toHaveAccessibleDescription(
      `${NAME_HINT} ${NAME_REQUIRED}`,
    );
  });

  it('keeps the values entered when going back a step', async () => {
    await completeSiteStep();
    const backButton = screen.getByRole('button', MOCK_BACK);
    await user.click(backButton);

    const nameField = screen.getByRole('textbox', MOCK_NAME_FIELD);

    expect(nameField).toHaveValue(MOCK_TENANT_NAME);
  });

  it('says the address is free once it has been checked', async () => {
    await completeSiteStep();
    await typeAddress();

    const available = await screen.findByText(MOCK_ADDRESS_AVAILABLE);

    expect(available).toBeVisible();
    expect(checkSiteAddressMock).toHaveBeenLastCalledWith(MOCK_SLUG);
  });

  it('shows a placeholder address in the preview before one is typed', async () => {
    await completeSiteStep();

    const preview = screen.getByRole('region', MOCK_LIVE_PREVIEW);

    expect(preview).toHaveTextContent(MOCK_ANNOUNCED_PLACEHOLDER_ADDRESS);
  });

  it('shows the typed address in the preview', async () => {
    await completeSiteStep();
    await typeAddress();

    const preview = screen.getByRole('region', MOCK_LIVE_PREVIEW);

    expect(preview).toHaveTextContent(MOCK_ANNOUNCED_SITE_ADDRESS);
    expect(preview).not.toHaveTextContent(MOCK_PLACEHOLDER_ADDRESS);
  });

  it('follows the address in the preview as each letter is typed', async () => {
    await completeSiteStep();
    const addressField = screen.getByRole('textbox', MOCK_ADDRESS_FIELD);
    const [firstLetter] = MOCK_SLUG;
    await user.type(addressField, firstLetter ?? '');

    const preview = screen.getByRole('region', MOCK_LIVE_PREVIEW);

    expect(preview).toHaveTextContent(
      `${SITE_ADDRESS_LABEL} ${firstLetter}.${MOCK_TENANT_ROOT_DOMAIN}`,
    );
  });

  it('keeps a taken address from continuing', async () => {
    checkSiteAddressMock.mockResolvedValue(TENANT_FIELD_ERROR.SLUG_TAKEN);
    await completeSiteStep();
    const addressField = await typeAddress();
    await screen.findAllByText(ADDRESS_TAKEN);

    const continueButton = screen.getByRole('button', MOCK_CONTINUE);

    await user.click(continueButton);

    const heading = stepHeading(STEPS.ADDRESS);

    expect(addressField).toBeInvalid();
    expect(heading).toBeVisible();
  });

  it('describes a taken address field by its suffix, hint and why it is taken', async () => {
    checkSiteAddressMock.mockResolvedValue(TENANT_FIELD_ERROR.SLUG_TAKEN);
    await completeSiteStep();
    const addressField = await typeAddress();
    await screen.findAllByText(ADDRESS_TAKEN);

    expect(addressField).toHaveAccessibleDescription(
      `.${MOCK_TENANT_ROOT_DOMAIN} ${SITE_ADDRESS_HINT} ${ADDRESS_TAKEN}`,
    );
  });

  it('announces a taken address in a status region', async () => {
    checkSiteAddressMock.mockResolvedValue(TENANT_FIELD_ERROR.SLUG_TAKEN);
    await completeSiteStep();
    await typeAddress();
    await screen.findAllByText(ADDRESS_TAKEN);

    const announcing = screen
      .getAllByRole('status')
      .filter((status) => status.textContent === ADDRESS_TAKEN);

    expect(announcing).toHaveLength(1);
  });

  it('describes the language select by its hint', async () => {
    await completeSiteStep();

    const languageSelect = screen.getByRole('combobox', {
      name: LANGUAGE_LABEL,
    });

    expect(languageSelect).toHaveAccessibleDescription(LANGUAGE_HINT);
  });

  it('says when the address could not be checked', async () => {
    checkSiteAddressMock.mockRejectedValue(new Error());
    await completeSiteStep();
    await typeAddress();

    const unverified = await screen.findByText(ADDRESS_UNVERIFIED);

    expect(unverified).toBeVisible();
  });

  it('lets the user continue when the address check fails', async () => {
    checkSiteAddressMock.mockRejectedValue(new Error());
    await completeSiteStep();
    await typeAddress();
    await screen.findByText(ADDRESS_UNVERIFIED);
    await clickContinue();

    const heading = stepHeading(STEPS.LOOK);

    expect(heading).toBeVisible();
  });

  it('keeps Continue disabled while the address is checked', async () => {
    await completeSiteStep();
    await typeAddress();

    const checking = screen.getByText(ADDRESS_CHECKING);
    const continueButton = screen.getByRole('button', MOCK_CONTINUE);

    expect(checking).toBeVisible();
    expect(continueButton).toHaveAttribute('aria-disabled', 'true');
  });

  it('keeps Continue reachable by keyboard while the address is checked', async () => {
    await completeSiteStep();
    await typeAddress();
    const backButton = screen.getByRole('button', MOCK_BACK);
    act(() => backButton.focus());
    await user.tab();

    const continueButton = screen.getByRole('button', MOCK_CONTINUE);

    expect(continueButton).toHaveFocus();
  });

  it('stays on the address step when Enter is pressed during the check', async () => {
    await completeSiteStep();
    const addressField = await typeAddress();
    await user.type(addressField, '{Enter}');

    const heading = stepHeading(STEPS.ADDRESS);

    expect(heading).toBeVisible();
  });

  it.each([
    [
      STEPS.SITE,
      t('siteSummary', { siteType: SITE_TYPES.BLOG, name: MOCK_TENANT_NAME }),
    ],
    [STEPS.ADDRESS, MOCK_SITE_ADDRESS],
    [STEPS.LOOK, EDITORIAL_PRESET],
  ])('shows the %s step’s choice once it is done', async (_, summary) => {
    await reachReview();

    const steps = screen.getByRole('list', { name: STEPS_ARIA_LABEL });

    const stepSummary = within(steps).getByText(summary);

    expect(stepSummary).toBeVisible();
  });

  it('announces the first step as one named progress bar', () => {
    expectProgressAt(ONBOARDING_STEP.SITE);
  });

  it('hides the visible step text from assistive tech', () => {
    const visibleText = screen.getByText(
      stepProgressText(ONBOARDING_STEP.SITE),
    );

    expect(isInaccessible(visibleText)).toBe(true);
  });

  it('moves the progress bar on to the next step on Continue', async () => {
    await completeSiteStep();

    expectProgressAt(ONBOARDING_STEP.ADDRESS);
  });

  it('moves the progress bar back a step on Back', async () => {
    await completeSiteStep();
    const backButton = screen.getByRole('button', MOCK_BACK);
    await user.click(backButton);

    expectProgressAt(ONBOARDING_STEP.SITE);
  });

  it('announces review as the last step', async () => {
    await reachReview();

    expectProgressAt(ONBOARDING_STEP.REVIEW);
  });

  it('moves the progress bar to the step opened from review', async () => {
    await reachReview();
    const editAddress = screen.getByRole('button', {
      name: t('editField', { field: SITE_ADDRESS_LABEL }),
    });
    await user.click(editAddress);

    expectProgressAt(ONBOARDING_STEP.ADDRESS);
  });

  it('opens a step from its Edit link on review', async () => {
    await reachReview();
    const editAddress = screen.getByRole('button', {
      name: t('editField', { field: SITE_ADDRESS_LABEL }),
    });
    await user.click(editAddress);

    const heading = stepHeading(STEPS.ADDRESS);

    expect(heading).toBeVisible();
  });

  it('returns to review after editing a step from it', async () => {
    await reachReview();
    const editName = screen.getByRole('button', {
      name: t('editField', { field: NAME_LABEL }),
    });
    await user.click(editName);
    await clickContinue();

    const heading = stepHeading(STEPS.REVIEW);

    expect(heading).toBeVisible();
  });

  it('replaces Continue with a separate Create site button on reaching review', async () => {
    await completeSiteStep();
    await completeAddressStep();
    const continueButton = screen.getByRole('button', MOCK_CONTINUE);
    await user.click(continueButton);

    const createButton = screen.getByRole('button', MOCK_CREATE);

    expect(createButton).toBeVisible();
    expect(continueButton).not.toBeInTheDocument();
  });

  it('neither creates the site nor flags the terms on arriving at review', async () => {
    createSiteMock.mockResolvedValue(MOCK_TERMS_NOT_ACCEPTED_RESULT);
    await reachReview();

    const heading = stepHeading(STEPS.REVIEW);
    const termsError = screen.queryByText(TERMS_NOT_ACCEPTED);

    expect(heading).toBeVisible();
    expect(createSiteMock).not.toHaveBeenCalled();
    expect(termsError).not.toBeInTheDocument();
  });

  it('neither creates the site nor flags the terms on returning to review from an edit', async () => {
    createSiteMock.mockResolvedValue(MOCK_TERMS_NOT_ACCEPTED_RESULT);
    await reachReview();
    const editName = screen.getByRole('button', {
      name: t('editField', { field: NAME_LABEL }),
    });
    await user.click(editName);
    await clickContinue();

    const heading = stepHeading(STEPS.REVIEW);
    const termsError = screen.queryByText(TERMS_NOT_ACCEPTED);

    expect(heading).toBeVisible();
    expect(createSiteMock).not.toHaveBeenCalled();
    expect(termsError).not.toBeInTheDocument();
  });

  it('flags the terms when Create site is pressed with the box unticked', async () => {
    createSiteMock.mockResolvedValue(MOCK_TERMS_NOT_ACCEPTED_RESULT);
    await reachReview();
    const createButton = screen.getByRole('button', MOCK_CREATE);
    await user.click(createButton);

    const message = await screen.findByText(TERMS_NOT_ACCEPTED);

    expect(message).toBeVisible();
  });

  it('clears the terms error once the box is ticked', async () => {
    createSiteMock.mockResolvedValue(MOCK_TERMS_NOT_ACCEPTED_RESULT);
    await reachReview();
    const createButton = screen.getByRole('button', MOCK_CREATE);
    await user.click(createButton);
    await screen.findByText(TERMS_NOT_ACCEPTED);
    const acceptance = screen.getByRole('checkbox', MOCK_ACCEPTANCE);
    await user.click(acceptance);

    const termsError = screen.queryByText(TERMS_NOT_ACCEPTED);

    expect(termsError).not.toBeInTheDocument();
  });

  it('returns to the address step when the address was taken meanwhile', async () => {
    createSiteMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { slug: { reason: TENANT_FIELD_ERROR.SLUG_TAKEN } },
    });
    await reachReview();
    await acceptAndCreate();

    await screen.findAllByText(ADDRESS_TAKEN);
    const addressField = screen.getByRole('textbox', MOCK_ADDRESS_FIELD);
    const heading = stepHeading(STEPS.ADDRESS);

    expect(addressField).toHaveAccessibleDescription(
      expect.stringContaining(ADDRESS_TAKEN),
    );
    expect(heading).toBeVisible();
  });

  it('offers Continue alone on the first step', () => {
    const backButton = screen.queryByRole('button', MOCK_BACK);
    const continueButton = screen.queryByRole('button', MOCK_CONTINUE);

    expect(backButton).not.toBeInTheDocument();
    expect(continueButton).toBeInTheDocument();
  });

  it('offers Back beside Continue from the second step', async () => {
    await completeSiteStep();

    const backButton = screen.queryByRole('button', MOCK_BACK);
    const continueButton = screen.queryByRole('button', MOCK_CONTINUE);

    expect(backButton).toBeInTheDocument();
    expect(continueButton).toBeInTheDocument();
  });

  it('offers Back beside Create site on review', async () => {
    await reachReview();

    const backButton = screen.queryByRole('button', MOCK_BACK);
    const createButton = screen.queryByRole('button', MOCK_CREATE);

    expect(backButton).toBeInTheDocument();
    expect(createButton).toBeInTheDocument();
  });

  it('moves focus to the start of the new step on Continue', async () => {
    await completeSiteStep();
    await user.tab();

    const addressField = screen.getByRole('textbox', MOCK_ADDRESS_FIELD);

    expect(addressField).toHaveFocus();
  });

  it('moves focus to the start of the earlier step on Back', async () => {
    await completeSiteStep();
    const backButton = screen.getByRole('button', MOCK_BACK);
    await user.click(backButton);
    await user.tab();

    const siteTypeSelect = screen.getByRole('combobox', MOCK_SITE_TYPE_SELECT);

    expect(siteTypeSelect).toHaveFocus();
  });

  it('shows the neutral refusal when creation is refused', async () => {
    createSiteMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: SIGN_UP_REFUSAL.TRY_AGAIN_LATER,
    });
    await reachReview();
    await acceptAndCreate();

    const refusal = await screen.findByText(TRY_AGAIN_LATER);

    expect(refusal).toBeVisible();
  });
});

const stubMatchMedia = window.matchMedia;

const stubTier = (initialQueries: readonly string[]) => {
  let matchingQueries = initialQueries;
  const listeners = new Set<EventListener>();
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    ...stubMatchMedia(query),
    get matches() {
      return matchingQueries.includes(query);
    },
    addEventListener: (_type: string, listener: EventListener) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: EventListener) => {
      listeners.delete(listener);
    },
  }));

  return (nextQueries: readonly string[]) => {
    matchingQueries = nextQueries;
    act(() => listeners.forEach((listener) => listener(new Event('change'))));
  };
};

const FULL_TIER = [ONBOARDING_TIER_QUERY.RAIL, ONBOARDING_TIER_QUERY.FULL];
const RAIL_TIER = [ONBOARDING_TIER_QUERY.RAIL];
const FULL_TIER_TITLE = 'from 1360px';
const RAIL_TIER_TITLE = 'from 768px';

const renderInTier = (matchingQueries: readonly string[]) => {
  user = userEvent.setup();
  checkSiteAddressMock.mockResolvedValue(undefined);
  const resizeTo = stubTier(matchingQueries);
  setup();
  return resizeTo;
};

const shellParts = () => ({
  main: screen.getByRole('main'),
  nameField: screen.getByRole('textbox', MOCK_NAME_FIELD),
  preview: screen.getByRole('region', MOCK_LIVE_PREVIEW),
  continueButton: screen.getByRole('button', MOCK_CONTINUE),
});

describe(`<${OnboardingView.name}/> layout`, () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('places the preview after the footer, outside main, from 1360px', () => {
    renderInTier(FULL_TIER);

    const { main, nameField, preview, continueButton } = shellParts();

    expect(main).toContainElement(continueButton);
    expect(main).not.toContainElement(preview);
    expect(nameField.compareDocumentPosition(continueButton)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(continueButton.compareDocumentPosition(preview)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('places the preview inside main between the fields and the footer from 768px', () => {
    renderInTier(RAIL_TIER);

    const { main, nameField, preview, continueButton } = shellParts();

    expect(main).toContainElement(preview);
    expect(main).toContainElement(continueButton);
    expect(nameField.compareDocumentPosition(preview)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(preview.compareDocumentPosition(continueButton)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('places the preview and then the actions after main on a phone', () => {
    renderInTier([]);

    const { main, nameField, preview, continueButton } = shellParts();

    expect(main).toContainElement(nameField);
    expect(main).not.toContainElement(preview);
    expect(main).not.toContainElement(continueButton);
    expect(main.compareDocumentPosition(preview)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(preview.compareDocumentPosition(continueButton)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  describe.each([
    [FULL_TIER_TITLE, FULL_TIER],
    [RAIL_TIER_TITLE, RAIL_TIER],
  ])('%s', (_tier, matchingQueries) => {
    beforeEach(() => {
      renderInTier(matchingQueries);
    });

    const expectClearOfFooter = (field: HTMLElement, footerButton: object) => {
      const scrollArea = screen.getByTestId(ONBOARDING_SCROLL_AREA_TEST_ID);
      const primaryButton = screen.getByRole('button', footerButton);

      expect(field).toHaveFocus();
      expect(scrollArea).toContainElement(field);
      expect(scrollArea).not.toContainElement(primaryButton);
    };

    it('scrolls Site name inside an area the pinned footer never covers', async () => {
      const nameField = screen.getByRole('textbox', MOCK_NAME_FIELD);
      act(() => nameField.focus());

      expectClearOfFooter(nameField, MOCK_CONTINUE);
    });

    it('scrolls the address input inside an area the pinned footer never covers', async () => {
      await completeSiteStep();
      const addressField = screen.getByRole('textbox', MOCK_ADDRESS_FIELD);
      act(() => addressField.focus());

      expectClearOfFooter(addressField, MOCK_CONTINUE);
    });

    it('scrolls the terms box inside an area the pinned footer never covers', async () => {
      await reachReview();
      const acceptance = screen.getByRole('checkbox', MOCK_ACCEPTANCE);
      act(() => acceptance.focus());

      expectClearOfFooter(acceptance, MOCK_CREATE);
    });
  });
});

const tDevice = makeEnTranslator('devicePreview');
const tMode = makeEnTranslator('previewModeControl');
const DEVICE_NAME = {
  [PREVIEW_DEVICE.DESKTOP]: tDevice('deviceDesktop'),
  [PREVIEW_DEVICE.TABLET]: tDevice('deviceTablet'),
  [PREVIEW_DEVICE.PHONE]: tDevice('devicePhone'),
};
const MOCK_LIGHT = { name: tMode('modeLight') };
const MOCK_DARK = { name: tMode('modeDark') };
const MOCK_FULL_STAGE = { width: 472, height: 728 };

const previewToolbar = () =>
  within(screen.getByRole('region', MOCK_LIVE_PREVIEW)).getByRole('toolbar', {
    name: tDevice('toolbarAriaLabel'),
  });

const deviceButton = (device: TPreviewDevice) =>
  within(previewToolbar()).getByRole('button', { name: DEVICE_NAME[device] });

const expectPressed = (button: HTMLElement, isPressed: boolean) => {
  expect(button).toHaveAttribute(ARIA_PRESSED, String(isPressed));
};

const sampleFrame = (device: TPreviewDevice) =>
  screen.getByRole('img', {
    name: tDevice('sampleAtWidth', { width: PREVIEW_DEVICE_WIDTH[device] }),
  });

const pressTabletAndDark = async () => {
  await user.click(deviceButton(PREVIEW_DEVICE.TABLET));
  const dark = within(previewToolbar()).getByRole('button', MOCK_DARK);
  await user.click(dark);
};

const expectTabletAndDark = () => {
  const dark = within(previewToolbar()).getByRole('button', MOCK_DARK);

  expectPressed(deviceButton(PREVIEW_DEVICE.TABLET), true);
  expectPressed(dark, true);
};

const readoutOf = (device: TPreviewDevice, percent: number) =>
  tDevice('readoutLong', { width: PREVIEW_DEVICE_WIDTH[device], percent });

describe(`<${OnboardingView.name}/> preview`, () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    {
      tier: FULL_TIER_TITLE,
      queries: FULL_TIER,
      device: PREVIEW_DEVICE.DESKTOP,
    },
    {
      tier: RAIL_TIER_TITLE,
      queries: RAIL_TIER,
      device: PREVIEW_DEVICE.DESKTOP,
    },
    { tier: 'on a phone', queries: [], device: PREVIEW_DEVICE.PHONE },
  ])('opens on $device and Light $tier', ({ queries, device }) => {
    renderInTier(queries);

    const light = within(previewToolbar()).getByRole('button', MOCK_LIGHT);
    const frame = sampleFrame(device);

    expectPressed(deviceButton(device), true);
    expectPressed(light, true);
    expect(frame).toBeInTheDocument();
  });

  it.each([
    { from: FULL_TIER_TITLE, queries: FULL_TIER, next: RAIL_TIER },
    { from: RAIL_TIER_TITLE, queries: RAIL_TIER, next: [] },
  ])(
    'keeps the pressed device and colour scheme after the window narrows across a tier edge $from',
    async ({ queries, next }) => {
      const resizeTo = renderInTier(queries);
      await pressTabletAndDark();

      resizeTo(next);

      expectTabletAndDark();
    },
  );

  describe(FULL_TIER_TITLE, () => {
    let restoreResizeObserver: () => void;

    beforeEach(() => {
      restoreResizeObserver = stubResizeObserver(() => MOCK_FULL_STAGE);
      renderInTier(FULL_TIER);
    });

    afterEach(() => {
      restoreResizeObserver();
    });

    it('offers only the device and colour scheme groups', () => {
      const groups = within(previewToolbar()).getAllByRole('group');

      expect(groups.map((group) => group.getAttribute('aria-label'))).toEqual([
        tDevice('deviceGroupAriaLabel'),
        tMode('previewColorSchemeAriaLabel'),
      ]);
    });

    it('names the frame by the width of the device pressed', async () => {
      await user.click(deviceButton(PREVIEW_DEVICE.TABLET));

      const frame = sampleFrame(PREVIEW_DEVICE.TABLET);

      expect(frame).toBeInTheDocument();
    });

    it('announces the long readout under the live preview heading', () => {
      const preview = screen.getByRole('region', MOCK_LIVE_PREVIEW);
      const heading = within(preview).getByRole('heading', {
        level: 2,
        ...MOCK_LIVE_PREVIEW,
      });
      const readout = within(preview).getByText(
        readoutOf(PREVIEW_DEVICE.DESKTOP, 37),
      );

      expect(heading).toBeVisible();
      expect(readout).toHaveRole('status');
    });

    it('announces the new size when another device is pressed', async () => {
      await user.click(deviceButton(PREVIEW_DEVICE.TABLET));

      const preview = screen.getByRole('region', MOCK_LIVE_PREVIEW);
      const readout = within(preview).getByText(
        readoutOf(PREVIEW_DEVICE.TABLET, 58),
      );

      expect(readout).toHaveRole('status');
    });

    it('keeps the pressed device and colour scheme after Continue and Back', async () => {
      await pressTabletAndDark();

      await completeSiteStep();
      expectTabletAndDark();
      const back = screen.getByRole('button', MOCK_BACK);
      await user.click(back);

      expectTabletAndDark();
    });

    it('keeps the pressed device and colour scheme after an Edit from review', async () => {
      await reachReview();
      await pressTabletAndDark();

      await changeSiteTypeFromReview(SITE_TYPES.DOCS);

      expectTabletAndDark();
    });
  });
});
