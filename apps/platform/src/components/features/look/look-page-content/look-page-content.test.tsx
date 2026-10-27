import { CAPABILITY, LOCALE_ISO_CODES, PRESET_ID } from '@blog/config';
import { getEnabledCapabilities } from '@platform/server/settings-features/get-enabled-capabilities';
import { expectArchivedOffersNoSave } from '@platform/testing/assert-archived-save';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { mockSiteConfig } from '@platform/testing/site-config/fixtures';
import {
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_ID,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';

import { LookPageContent } from './look-page-content';

const { getSiteConfigMock, selectLiveLocalesMock } = vi.hoisted(() => ({
  getSiteConfigMock: vi.fn(),
  selectLiveLocalesMock: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    siteConfig: { getSiteConfig: getSiteConfigMock },
    tenants: { selectLiveLocales: selectLiveLocalesMock },
  },
}));

vi.mock('@platform/server/settings-features/get-enabled-capabilities');

const MOCK_ACCENT_HUE = 28;
const SIGN_IN = 'Sign in';

const tLogoHue = makeEnTranslator('logoHueField');

const tenant = mockReadyTenant();

const setup = customRenderAsync(LookPageContent, { tenant });

describe(`<${LookPageContent.name}/>`, () => {
  beforeEach(() => {
    getSiteConfigMock.mockResolvedValue(undefined);
    selectLiveLocalesMock.mockReturnValue([LOCALE_ISO_CODES.EN]);
  });

  it('renders the Console defaults when the tenant has no saved look yet', async () => {
    await setup();

    const heading = screen.getByRole('heading', { name: 'Look' });
    const consoleRadio = screen.getByRole('radio', { name: 'Console' });

    expect(getSiteConfigMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(heading).toBeVisible();
    expect(consoleRadio).toBeChecked();
  });

  it("renders the tenant's saved look when one exists", async () => {
    getSiteConfigMock.mockResolvedValue(
      mockSiteConfig({
        preset: PRESET_ID.EDITORIAL,
        accentHue: MOCK_ACCENT_HUE,
      }),
    );

    await setup();

    const editorialRadio = screen.getByRole('radio', { name: 'Editorial' });
    const hueValue = screen.getByText(
      tLogoHue('hueValue', { hue: MOCK_ACCENT_HUE }),
    );

    expect(editorialRadio).toBeChecked();
    expect(hueValue).toBeVisible();
  });

  it('previews Sign in when a reader feature is on', async () => {
    vi.mocked(getEnabledCapabilities).mockResolvedValueOnce([
      CAPABILITY.BOOKMARKS,
    ]);

    await setup();

    const signInButton = screen.getByRole('button', { name: SIGN_IN });

    expect(signInButton).toBeVisible();
  });

  it('previews no Sign in when only non-reader features are on', async () => {
    vi.mocked(getEnabledCapabilities).mockResolvedValueOnce([
      CAPABILITY.ANALYTICS,
    ]);

    await setup();

    const signInButton = screen.queryByRole('button', { name: SIGN_IN });

    expect(signInButton).not.toBeInTheDocument();
  });

  it('shows the archived notice for a deprovisioned tenant', async () => {
    await setup({ tenant: { ...tenant, deprovisionedAt: MOCK_ARCHIVED_AT } });

    expectArchivedOffersNoSave();
  });
});
