import { PRESET_ID } from '@blog/config';
import type { TTenant } from '@blog/db/schema/tenants';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { makeReadyTenant } from '@platform/testing/tenants/fixtures';

import { FeaturesPageContent } from './features-page-content';

const { getSettingsFeaturesAndPresetMock } = vi.hoisted(() => ({
  getSettingsFeaturesAndPresetMock: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    settingsFeatures: {
      getSettingsFeaturesAndPreset: getSettingsFeaturesAndPresetMock,
    },
  },
}));

vi.mock('@platform/server/auth/auth');

const buildTenant = (plan: 'FREE' | 'GROWTH'): TTenant =>
  makeReadyTenant({ plan });

const setup = customRenderAsync(FeaturesPageContent, {
  tenant: buildTenant('FREE'),
});

describe(`<${FeaturesPageContent.name}/>`, () => {
  beforeEach(() => {
    getSettingsFeaturesAndPresetMock.mockReset();
    getSettingsFeaturesAndPresetMock.mockResolvedValue({
      features: undefined,
      preset: undefined,
    });
  });

  it('renders CONSOLE featureDefaults with no settings_features or site_config row', async () => {
    await setup({ tenant: buildTenant('GROWTH') });

    expect(getSettingsFeaturesAndPresetMock).toHaveBeenCalledWith('tenant-1');
    expect(screen.getByRole('switch', { name: 'Bookmarks' })).toHaveAttribute(
      'data-checked',
      '',
    );
    expect(screen.getByRole('switch', { name: 'Analytics' })).toHaveAttribute(
      'data-unchecked',
      '',
    );
  });

  it("renders the tenant's saved settings_features row when one exists", async () => {
    getSettingsFeaturesAndPresetMock.mockResolvedValue({
      features: {
        commentsEnabled: true,
        ratingsEnabled: true,
        bookmarksEnabled: false,
        newsletterEnabled: true,
        analyticsEnabled: true,
        consentBannerEnabled: false,
      },
      preset: undefined,
    });

    await setup({ tenant: buildTenant('GROWTH') });

    expect(screen.getByRole('switch', { name: 'Bookmarks' })).toHaveAttribute(
      'data-unchecked',
      '',
    );
    expect(screen.getByRole('switch', { name: 'Analytics' })).toHaveAttribute(
      'data-checked',
      '',
    );
  });

  it('falls back to EDITORIAL featureDefaults when site_config has that preset saved', async () => {
    getSettingsFeaturesAndPresetMock.mockResolvedValue({
      features: undefined,
      preset: PRESET_ID.EDITORIAL,
    });

    await setup({ tenant: buildTenant('GROWTH') });

    expect(screen.getByRole('switch', { name: 'Bookmarks' })).toHaveAttribute(
      'data-checked',
      '',
    );
  });

  it('disables the GROWTH-only toggles for a FREE-plan tenant', async () => {
    await setup({ tenant: buildTenant('FREE') });

    expect(screen.getByRole('switch', { name: 'Analytics' })).toHaveAttribute(
      'data-disabled',
      '',
    );
  });

  it('clamps a stale out-of-plan value to unchecked+disabled after a plan downgrade', async () => {
    getSettingsFeaturesAndPresetMock.mockResolvedValue({
      features: {
        commentsEnabled: true,
        ratingsEnabled: true,
        bookmarksEnabled: true,
        newsletterEnabled: false,
        analyticsEnabled: true,
        consentBannerEnabled: false,
      },
      preset: undefined,
    });

    await setup({ tenant: buildTenant('FREE') });

    const analyticsSwitch = screen.getByRole('switch', { name: 'Analytics' });
    expect(analyticsSwitch).toHaveAttribute('data-unchecked', '');
    expect(analyticsSwitch).toHaveAttribute('data-disabled', '');
  });

  it('enables every toggle for a GROWTH-plan tenant', async () => {
    await setup({ tenant: buildTenant('GROWTH') });

    expect(
      screen.getByRole('switch', { name: 'Analytics' }),
    ).not.toHaveAttribute('data-disabled');
    expect(
      screen.getByRole('switch', { name: 'Cookie consent banner' }),
    ).not.toHaveAttribute('data-disabled');
  });

  it('passes the archived date through for a deprovisioned tenant', async () => {
    const tenant = buildTenant('FREE');
    await setup({
      tenant: {
        ...tenant,
        deprovisionedAt: new Date('2026-08-26T00:00:00.000Z'),
      },
    });

    expect(screen.getByText('This tenant is archived')).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Save changes' }),
    ).not.toBeInTheDocument();
  });
});
