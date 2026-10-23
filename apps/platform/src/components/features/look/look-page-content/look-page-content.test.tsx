import {
  CAPABILITY,
  PRESET_ID,
  LOCALE_ISO_CODES,
  FONT_CHOICE,
  RADIUS_SCALE,
  DENSITY,
  LANGUAGE_SWITCHER_STYLE,
} from '@blog/config';
import { expectArchivedOffersNoSave } from '@platform/testing/assert-archived-save';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  makeReadyTenant,
  MOCK_ARCHIVED_AT,
  TENANT_ID,
} from '@platform/testing/tenants/fixtures';

import { LookPageContent } from './look-page-content';

const { getSiteConfigMock, selectLiveLocalesMock, getEnabledCapabilitiesMock } =
  vi.hoisted(() => ({
    getSiteConfigMock: vi.fn(),
    selectLiveLocalesMock: vi.fn(),
    getEnabledCapabilitiesMock: vi.fn(),
  }));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    siteConfig: { getSiteConfig: getSiteConfigMock },
    tenants: { selectLiveLocales: selectLiveLocalesMock },
  },
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/settings-features/get-enabled-capabilities', () => ({
  getEnabledCapabilities: getEnabledCapabilitiesMock,
}));

const tenant = makeReadyTenant();

const setup = customRenderAsync(LookPageContent, { tenant });

const ARIA_CHECKED = 'aria-checked';

describe(`<${LookPageContent.name}/>`, () => {
  beforeEach(() => {
    getSiteConfigMock.mockReset();
    getSiteConfigMock.mockResolvedValue(undefined);
    selectLiveLocalesMock.mockReturnValue([LOCALE_ISO_CODES.EN]);
    getEnabledCapabilitiesMock.mockReset();
    getEnabledCapabilitiesMock.mockResolvedValue([]);
  });

  it('renders Console defaults when the tenant has no saved site_config row yet', async () => {
    await setup();

    expect(getSiteConfigMock).toHaveBeenCalledWith(TENANT_ID);
    expect(screen.getByRole('heading', { name: 'Look' })).toBeVisible();
    expect(screen.getByRole('radio', { name: 'Console' })).toHaveAttribute(
      ARIA_CHECKED,
      'true',
    );
  });

  it('previews Sign in when a reader feature is on', async () => {
    getEnabledCapabilitiesMock.mockResolvedValue([CAPABILITY.BOOKMARKS]);

    await setup();

    expect(screen.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  it('previews no Sign in when only non-reader features are on', async () => {
    getEnabledCapabilitiesMock.mockResolvedValue([CAPABILITY.ANALYTICS]);

    await setup();

    expect(
      screen.queryByRole('button', { name: 'Sign in' }),
    ).not.toBeInTheDocument();
  });

  it('passes the archived date through for a deprovisioned tenant', async () => {
    await setup({
      tenant: {
        ...tenant,
        deprovisionedAt: MOCK_ARCHIVED_AT,
      },
    });

    expectArchivedOffersNoSave();
  });

  it("renders the tenant's saved site_config row when one exists", async () => {
    getSiteConfigMock.mockResolvedValue({
      id: 'config-1',
      tenantId: TENANT_ID,
      preset: PRESET_ID.EDITORIAL,
      accentHue: 28,
      logoHue: undefined,
      headingFont: FONT_CHOICE.FRAUNCES,
      bodyFont: FONT_CHOICE.INTER,
      radiusScale: RADIUS_SCALE.SM,
      density: DENSITY.COMPACT,
      languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.MENU_CODE,
      logoAssetUrl: undefined,
      faviconAssetUrl: undefined,
      voiceOverrides: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await setup();

    expect(screen.getByRole('radio', { name: 'Editorial' })).toHaveAttribute(
      ARIA_CHECKED,
      'true',
    );
    expect(screen.getByText('hue 28°')).toBeVisible();
  });
});
