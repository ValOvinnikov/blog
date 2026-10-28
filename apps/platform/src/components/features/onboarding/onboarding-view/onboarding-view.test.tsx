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
import { checkSiteAddressAction } from '@platform/server/onboarding/check-site-address-action';
import { createSiteAction } from '@platform/server/onboarding/create-site-action';
import {
  customRender,
  screen,
  waitForElementToBeRemoved,
  within,
} from '@platform/testing/custom-render';
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
const MOCK_NAME_FIELD = { name: 'Site name' };
const MOCK_ADDRESS_FIELD = { name: 'Site address' };
const MOCK_ACCEPTANCE = { name: /I agree to the Terms of Service/ };
const MOCK_CREATE = { name: 'Create site' };
const MOCK_CONTINUE = { name: 'Continue' };
const MOCK_BACK = { name: 'Back' };
const MOCK_ADDRESS_AVAILABLE = `${MOCK_SITE_ADDRESS} is available.`;
const MOCK_ADDRESS_CHECKING = 'Checking the address…';
const MOCK_ADDRESS_TAKEN = 'This address is taken. Choose another.';
const MOCK_PLACEHOLDER_ADDRESS = `your-site.${MOCK_TENANT_ROOT_DOMAIN}`;
const MOCK_LIVE_PREVIEW = { name: 'Live preview' };
const MOCK_SITE_TYPE_SELECT = { name: 'Site type' };
const MOCK_EDIT_SITE_TYPE = { name: 'Edit Site type' };
const MOCK_ACCENT_SLIDER = { name: 'Accent colour' };
const MOCK_EDITORIAL_LOOK = {
  preset: PRESET_ID.EDITORIAL,
  accentHue: PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens.accentHue,
};
const MOCK_CONSOLE_LOOK = {
  preset: PRESET_ID.CONSOLE,
  accentHue: PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens.accentHue,
};

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
});

describe(`<${OnboardingView.name}/>`, () => {
  let user: UserEvent;

  const stepHeading = (name: string) =>
    screen.getByRole('heading', { level: 1, name });

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
    const consolePreset = screen.getByRole('radio', { name: 'Console' });
    await user.click(consolePreset);
    await clickContinue();
    await acceptAndCreate();

    expect(createSiteMock).toHaveBeenCalledWith({
      ...MOCK_CREATE_SITE_INPUT,
      ...MOCK_CONSOLE_LOOK,
    });
  });

  it('creates the site type the user picks', async () => {
    await pickSiteType('Portfolio');
    await reachReview();
    await acceptAndCreate();

    expect(createSiteMock).toHaveBeenCalledWith({
      ...MOCK_CREATE_SITE_INPUT,
      siteType: SITE_TYPE.PORTFOLIO,
    });
  });

  it.each(['Docs', 'Blank'])(
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
    await changeSiteTypeFromReview('Docs');
    await changeSiteTypeFromReview('Personal / résumé');
    await acceptAndCreate();

    expect(createSiteMock).toHaveBeenCalledWith(
      expect.objectContaining(MOCK_EDITORIAL_LOOK),
    );
  });

  it('keeps the preset the user picked when the site type changes', async () => {
    await completeSiteStep();
    await completeAddressStep();
    const consolePreset = screen.getByRole('radio', { name: 'Console' });
    await user.click(consolePreset);
    await clickContinue();
    await changeSiteTypeFromReview('Portfolio');
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
    await clickContinue();
    await changeSiteTypeFromReview('Docs');
    await acceptAndCreate();

    expect(createSiteMock).toHaveBeenCalledWith(
      expect.objectContaining({
        preset: PRESET_ID.EDITORIAL,
        accentHue: MOCK_EDITORIAL_LOOK.accentHue + 1,
      }),
    );
  });

  it('asks for a name before leaving the first step', async () => {
    await clickContinue();

    const message = screen.getByText('Enter a name for your site.');
    const heading = stepHeading('Site');

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
    await screen.findByText(MOCK_ADDRESS_TAKEN);
    await clickContinue();

    const heading = stepHeading('Address');

    expect(addressField).toBeInvalid();
    expect(heading).toBeVisible();
  });

  it('lets the user continue when the address check fails', async () => {
    checkSiteAddressMock.mockRejectedValue(new Error());
    await completeSiteStep();
    await typeAddress();
    await waitForElementToBeRemoved(() =>
      screen.queryByText(MOCK_ADDRESS_CHECKING),
    );
    await clickContinue();

    const heading = stepHeading('Look');

    expect(heading).toBeVisible();
  });

  it('lets the user continue before the address check answers', async () => {
    await completeSiteStep();
    await typeAddress();
    await clickContinue();

    const heading = stepHeading('Look');

    expect(heading).toBeVisible();
  });

  it.each([
    ['Site', `Blog · ${MOCK_TENANT_NAME}`],
    ['Address', MOCK_SITE_ADDRESS],
    ['Look', 'Editorial'],
  ])('shows the %s step’s choice once it is done', async (_, summary) => {
    await reachReview();

    const steps = screen.getByRole('list', { name: 'Setup steps' });

    const stepSummary = within(steps).getByText(summary);

    expect(stepSummary).toBeVisible();
  });

  it('opens a step from its Edit link on review', async () => {
    await reachReview();
    const editAddress = screen.getByRole('button', {
      name: 'Edit Site address',
    });
    await user.click(editAddress);

    const heading = stepHeading('Address');

    expect(heading).toBeVisible();
  });

  it('returns to review after editing a step from it', async () => {
    await reachReview();
    const editName = screen.getByRole('button', { name: 'Edit Site name' });
    await user.click(editName);
    await clickContinue();

    const heading = stepHeading('Review');

    expect(heading).toBeVisible();
  });

  it('returns to the address step when the address was taken meanwhile', async () => {
    createSiteMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { slug: { reason: TENANT_FIELD_ERROR.SLUG_TAKEN } },
    });
    await reachReview();
    await acceptAndCreate();

    const message = await screen.findByText(MOCK_ADDRESS_TAKEN);
    const heading = stepHeading('Address');

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

    const refusal = await screen.findByText('Try again later.');

    expect(refusal).toBeVisible();
  });
});
