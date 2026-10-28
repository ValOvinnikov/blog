import {
  ACTION_OUTCOME,
  LOCALE_ISO_CODES,
  PRESET_ID,
  PRESET_REGISTRY,
  SITE_TYPE,
} from '@blog/config';
import { faker } from '@faker-js/faker';
import { SIGN_UP_REFUSAL } from '@platform/constants/sign-up';
import { TENANT_FIELD_ERROR } from '@platform/constants/tenant';
import messages from '@platform/i18n/messages/en.json';
import { checkSiteAddressAction } from '@platform/server/onboarding/check-site-address-action';
import { createSiteAction } from '@platform/server/onboarding/create-site-action';
import { customRender, screen, within } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
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
  siteAddressLabel: SITE_ADDRESS_LABEL,
  siteAddressChecking: ADDRESS_CHECKING,
  siteAddressUnverified: ADDRESS_UNVERIFIED,
  previewAddressPlaceholder: PLACEHOLDER_SLUG,
  createSite: CREATE_SITE,
  continue: CONTINUE,
  back: BACK,
  siteTypeLabel: SITE_TYPE_LABEL,
  siteTypes: SITE_TYPES,
  steps: STEPS,
  stepsAriaLabel: STEPS_ARIA_LABEL,
  fieldErrors: { nameRequired: NAME_REQUIRED, siteAddressTaken: ADDRESS_TAKEN },
  failures: { tryAgainLater: TRY_AGAIN_LATER },
} = messages.onboardingForm;
const { console: CONSOLE_PRESET, editorial: EDITORIAL_PRESET } =
  messages.presetPicker;
const [ACCEPT_TERMS_LEAD] = messages.termsAcceptance.acceptTerms.split('<');
const t = makeEnTranslator('onboardingForm');

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
const MOCK_LIVE_PREVIEW = {
  name: messages.previewModeControl.livePreviewHeading,
};

const MOCK_CREATE_SITE_INPUT = {
  siteType: SITE_TYPE.BLOG,
  name: MOCK_TENANT_NAME,
  slug: MOCK_SLUG,
  locale: LOCALE_ISO_CODES.EN,
  preset: PRESET_ID.CONSOLE,
  accentHue: PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens.accentHue,
  hasAcceptedTerms: true,
};

const setup = customRender(OnboardingView, {
  rootDomain: MOCK_TENANT_ROOT_DOMAIN,
  legalPageUrls: toLegalPageUrls(MOCK_TENANT_ROOT_DOMAIN),
  initialLocale: LOCALE_ISO_CODES.EN,
});

describe(`<${OnboardingView.name}/>`, () => {
  let user: UserEvent;

  const stepHeading = (name: string) =>
    screen.getByRole('heading', { level: 1, name });

  const clickContinue = async () => {
    const continueButton = screen.getByRole('button', MOCK_CONTINUE);
    await user.click(continueButton);
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

  beforeEach(() => {
    user = userEvent.setup();
    checkSiteAddressMock.mockResolvedValue(undefined);
    createSiteMock.mockResolvedValue({ outcome: ACTION_OUTCOME.SUCCESS });
    setup();
  });

  it('creates the site from the values the user entered', async () => {
    await reachReview();
    await acceptAndCreate();

    expect(createSiteMock).toHaveBeenCalledWith(MOCK_CREATE_SITE_INPUT);
  });

  it('starts from the accent of the preset the user picks', async () => {
    await completeSiteStep();
    await completeAddressStep();
    const editorialPreset = screen.getByRole('radio', {
      name: EDITORIAL_PRESET,
    });
    await user.click(editorialPreset);
    await clickContinue();
    await acceptAndCreate();

    expect(createSiteMock).toHaveBeenCalledWith({
      ...MOCK_CREATE_SITE_INPUT,
      preset: PRESET_ID.EDITORIAL,
      accentHue: PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens.accentHue,
    });
  });

  it('creates the site type the user picks', async () => {
    const siteTypeSelect = screen.getByRole('combobox', {
      name: SITE_TYPE_LABEL,
    });
    await user.click(siteTypeSelect);
    const portfolioOption = await screen.findByRole('option', {
      name: SITE_TYPES.PORTFOLIO,
    });
    await user.click(portfolioOption);
    await reachReview();
    await acceptAndCreate();

    expect(createSiteMock).toHaveBeenCalledWith({
      ...MOCK_CREATE_SITE_INPUT,
      siteType: SITE_TYPE.PORTFOLIO,
    });
  });

  it('asks for a name before leaving the first step', async () => {
    await clickContinue();

    const message = screen.getByText(NAME_REQUIRED);
    const heading = stepHeading(STEPS.SITE);

    expect(message).toBeVisible();
    expect(heading).toBeVisible();
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

    expect(preview).toHaveTextContent(MOCK_PLACEHOLDER_ADDRESS);
  });

  it('shows the typed address in the preview', async () => {
    await completeSiteStep();
    await typeAddress();

    const preview = screen.getByRole('region', MOCK_LIVE_PREVIEW);

    expect(preview).toHaveTextContent(MOCK_SITE_ADDRESS);
    expect(preview).not.toHaveTextContent(MOCK_PLACEHOLDER_ADDRESS);
  });

  it('keeps a taken address from continuing', async () => {
    checkSiteAddressMock.mockResolvedValue(TENANT_FIELD_ERROR.SLUG_TAKEN);
    await completeSiteStep();
    const addressField = await typeAddress();
    await screen.findByText(ADDRESS_TAKEN);

    const continueButton = screen.getByRole('button', MOCK_CONTINUE);

    expect(addressField).toBeInvalid();
    expect(continueButton).toBeDisabled();
  });

  it('describes a taken address field by why it is taken', async () => {
    checkSiteAddressMock.mockResolvedValue(TENANT_FIELD_ERROR.SLUG_TAKEN);
    await completeSiteStep();
    const addressField = await typeAddress();
    await screen.findByText(ADDRESS_TAKEN);

    expect(addressField).toHaveAccessibleDescription(
      expect.stringContaining(ADDRESS_TAKEN),
    );
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
    expect(continueButton).toBeDisabled();
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
    [STEPS.LOOK, CONSOLE_PRESET],
  ])('shows the %s step’s choice once it is done', async (_, summary) => {
    await reachReview();

    const steps = screen.getByRole('list', { name: STEPS_ARIA_LABEL });

    const stepSummary = within(steps).getByText(summary);

    expect(stepSummary).toBeVisible();
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

  it('returns to the address step when the address was taken meanwhile', async () => {
    createSiteMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { slug: { reason: TENANT_FIELD_ERROR.SLUG_TAKEN } },
    });
    await reachReview();
    await acceptAndCreate();

    const message = await screen.findByText(ADDRESS_TAKEN);
    const heading = stepHeading(STEPS.ADDRESS);

    expect(message).toBeVisible();
    expect(heading).toBeVisible();
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
