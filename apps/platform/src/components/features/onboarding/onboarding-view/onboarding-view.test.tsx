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

  const clickContinue = () =>
    user.click(screen.getByRole('button', MOCK_CONTINUE));

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
    await user.click(screen.getByRole('checkbox', MOCK_ACCEPTANCE));
    await user.click(screen.getByRole('button', MOCK_CREATE));
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
    await user.click(screen.getByRole('radio', { name: 'Editorial' }));
    await clickContinue();
    await acceptAndCreate();

    expect(createSiteMock).toHaveBeenCalledWith({
      ...MOCK_CREATE_SITE_INPUT,
      preset: PRESET_ID.EDITORIAL,
      accentHue: PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens.accentHue,
    });
  });

  it('creates the site type the user picks', async () => {
    await user.click(screen.getByRole('combobox', { name: 'Site type' }));
    await user.click(await screen.findByRole('option', { name: 'Portfolio' }));
    await reachReview();
    await acceptAndCreate();

    expect(createSiteMock).toHaveBeenCalledWith({
      ...MOCK_CREATE_SITE_INPUT,
      siteType: SITE_TYPE.PORTFOLIO,
    });
  });

  it('asks for a name before leaving the first step', async () => {
    await clickContinue();

    const message = screen.getByText('Enter a name for your site.');

    expect(message).toBeVisible();
    expect(stepHeading('Site')).toBeVisible();
  });

  it('keeps the values entered when going back a step', async () => {
    await completeSiteStep();
    await user.click(screen.getByRole('button', MOCK_BACK));

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

  it('keeps a taken address from continuing', async () => {
    checkSiteAddressMock.mockResolvedValue(TENANT_FIELD_ERROR.SLUG_TAKEN);
    await completeSiteStep();
    const addressField = await typeAddress();
    await screen.findByText(MOCK_ADDRESS_TAKEN);
    await clickContinue();

    expect(addressField).toBeInvalid();
    expect(stepHeading('Address')).toBeVisible();
  });

  it('lets the user continue when the address check fails', async () => {
    checkSiteAddressMock.mockRejectedValue(new Error());
    await completeSiteStep();
    await typeAddress();
    await waitForElementToBeRemoved(() =>
      screen.queryByText(MOCK_ADDRESS_CHECKING),
    );
    await clickContinue();

    expect(stepHeading('Look')).toBeVisible();
  });

  it('lets the user continue before the address check answers', async () => {
    await completeSiteStep();
    await typeAddress();
    await clickContinue();

    expect(stepHeading('Look')).toBeVisible();
  });

  it.each([
    ['Site', `Blog · ${MOCK_TENANT_NAME}`],
    ['Address', MOCK_SITE_ADDRESS],
    ['Look', 'Console'],
  ])('shows the %s step’s choice once it is done', async (_, summary) => {
    await reachReview();

    const steps = screen.getByRole('list', { name: 'Setup steps' });

    expect(within(steps).getByText(summary)).toBeVisible();
  });

  it('opens a step from its Edit link on review', async () => {
    await reachReview();
    await user.click(screen.getByRole('button', { name: 'Edit Site address' }));

    expect(stepHeading('Address')).toBeVisible();
  });

  it('returns to review after editing a step from it', async () => {
    await reachReview();
    await user.click(screen.getByRole('button', { name: 'Edit Site name' }));
    await clickContinue();

    expect(stepHeading('Review')).toBeVisible();
  });

  it('returns to the address step when the address was taken meanwhile', async () => {
    createSiteMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { slug: { reason: TENANT_FIELD_ERROR.SLUG_TAKEN } },
    });
    await reachReview();
    await acceptAndCreate();

    const message = await screen.findByText(MOCK_ADDRESS_TAKEN);

    expect(message).toBeVisible();
    expect(stepHeading('Address')).toBeVisible();
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
