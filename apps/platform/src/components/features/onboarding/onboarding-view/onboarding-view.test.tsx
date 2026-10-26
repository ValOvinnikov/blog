import {
  ACTION_OUTCOME,
  LOCALE_ISO_CODES,
  PRESET_ID,
  PRESET_REGISTRY,
  SITE_TYPE,
} from '@blog/config';
import { SIGN_UP_REFUSAL } from '@platform/constants/sign-up';
import { TENANT_FIELD_ERROR } from '@platform/constants/tenant';
import { checkSiteAddressAction } from '@platform/server/onboarding/check-site-address-action';
import { createSiteAction } from '@platform/server/onboarding/create-site-action';
import { customRender, screen } from '@platform/testing/custom-render';
import { MOCK_TENANT_ROOT_DOMAIN } from '@platform/testing/env/fixtures';
import { MOCK_TENANT_NAME } from '@platform/testing/tenants/fixtures';
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

const MOCK_SLUG = 'my-site';
const MOCK_NAME_FIELD = { name: 'Site name' };
const MOCK_ADDRESS_FIELD = { name: 'Site address' };
const MOCK_ACCEPTANCE = { name: /I agree to the Terms of Service/ };
const MOCK_CREATE = { name: 'Create site' };

const setup = customRender(OnboardingView, {
  rootDomain: MOCK_TENANT_ROOT_DOMAIN,
  legalPageUrls: toLegalPageUrls(MOCK_TENANT_ROOT_DOMAIN),
  initialLocale: LOCALE_ISO_CODES.EN,
});

describe(`<${OnboardingView.name}/>`, () => {
  let user: UserEvent;

  const fillAndCreate = async () => {
    await user.type(
      screen.getByRole('textbox', MOCK_NAME_FIELD),
      MOCK_TENANT_NAME,
    );
    await user.type(screen.getByRole('textbox', MOCK_ADDRESS_FIELD), MOCK_SLUG);
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
    await fillAndCreate();

    expect(createSiteMock).toHaveBeenCalledWith({
      siteType: SITE_TYPE.BLOG,
      name: MOCK_TENANT_NAME,
      slug: MOCK_SLUG,
      locale: LOCALE_ISO_CODES.EN,
      preset: PRESET_ID.CONSOLE,
      accentHue: PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens.accentHue,
      hasAcceptedTerms: true,
    });
  });

  it('starts from the accent of the preset the user picks', async () => {
    await user.click(screen.getByRole('radio', { name: 'Editorial' }));
    await fillAndCreate();

    expect(createSiteMock).toHaveBeenCalledWith(
      expect.objectContaining({
        preset: PRESET_ID.EDITORIAL,
        accentHue: PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens.accentHue,
      }),
    );
  });

  it('creates the site type the user picks', async () => {
    await user.click(screen.getByRole('combobox', { name: 'Site type' }));
    await user.click(await screen.findByRole('option', { name: 'Portfolio' }));
    await fillAndCreate();

    expect(createSiteMock).toHaveBeenCalledWith(
      expect.objectContaining({ siteType: SITE_TYPE.PORTFOLIO }),
    );
  });

  it('says the address is free once it has been checked', async () => {
    await user.type(screen.getByRole('textbox', MOCK_ADDRESS_FIELD), MOCK_SLUG);

    const available = await screen.findByText(
      `${MOCK_SLUG}.${MOCK_TENANT_ROOT_DOMAIN} is available.`,
    );

    expect(available).toBeVisible();
    expect(checkSiteAddressMock).toHaveBeenLastCalledWith(MOCK_SLUG);
  });

  it('marks a taken address invalid', async () => {
    checkSiteAddressMock.mockResolvedValue(TENANT_FIELD_ERROR.SLUG_TAKEN);

    await user.type(screen.getByRole('textbox', MOCK_ADDRESS_FIELD), MOCK_SLUG);

    const message = await screen.findByText(
      'This address is taken. Choose another.',
    );

    expect(message).toBeVisible();
    expect(screen.getByRole('textbox', MOCK_ADDRESS_FIELD)).toBeInvalid();
  });

  it('shows the neutral refusal when site creation is refused', async () => {
    createSiteMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: SIGN_UP_REFUSAL.TRY_AGAIN_LATER,
    });

    await fillAndCreate();

    expect(await screen.findByText('Try again later.')).toBeVisible();
  });
});
