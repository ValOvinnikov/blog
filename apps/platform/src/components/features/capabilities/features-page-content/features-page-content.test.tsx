import { PRESET_ID } from '@blog/config';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';

import { FeaturesPageContent } from './features-page-content';

const { getSettingsFeaturesMock, getSiteConfigMock } = vi.hoisted(() => ({
  getSettingsFeaturesMock: vi.fn(),
  getSiteConfigMock: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    settingsFeatures: { getSettingsFeatures: getSettingsFeaturesMock },
    siteConfig: { getSiteConfig: getSiteConfigMock },
  },
}));

// `FeaturesSettings` -> `updateFeaturesAction` -> `requireTenantMembership`
// imports the real `./auth` module — mocked here (unused by this test
// otherwise) purely so that chain never evaluates the real `NextAuth()`
// call at import time.
vi.mock('@platform/server/auth/auth', () => ({ auth: vi.fn() }));

const provisioningSteps = {
  [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
    status: TENANT_PROVISIONING_STEP_STATUS.DONE,
  },
  [TENANT_PROVISIONING_STEP.SEED_CONTENT]: {
    status: TENANT_PROVISIONING_STEP_STATUS.DONE,
  },
  [TENANT_PROVISIONING_STEP.PERSIST_TOKEN]: {
    status: TENANT_PROVISIONING_STEP_STATUS.DONE,
  },
  [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: {
    status: TENANT_PROVISIONING_STEP_STATUS.DONE,
  },
  [TENANT_PROVISIONING_STEP.CREATE_WEBHOOK]: {
    status: TENANT_PROVISIONING_STEP_STATUS.DONE,
  },
  [TENANT_PROVISIONING_STEP.OWNER_ELEVATION]: {
    status: TENANT_PROVISIONING_STEP_STATUS.IDLE,
  },
};

const buildTenant = (plan: 'FREE' | 'GROWTH'): TTenant => ({
  id: 'tenant-1',
  slug: 'acme',
  name: 'Acme Inc.',
  primaryDomain: 'acme.example.com',
  sanityProjectId: 'proj-1',
  sanityDataset: 'production',
  sanityReadTokenEncrypted: null,
  locale: 'en',
  plan,
  status: 'ACTIVE',
  provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
  provisioningSteps,
  studioVercelProjectId: null,
  seededAt: new Date('2026-01-01T00:00:00.000Z'),
  webhookCreatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deprovisionedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const setup = customRenderAsync(FeaturesPageContent, {
  tenant: buildTenant('FREE'),
});

describe(`<${FeaturesPageContent.name}/>`, () => {
  beforeEach(() => {
    getSettingsFeaturesMock.mockReset();
    getSiteConfigMock.mockReset();
  });

  it('renders CONSOLE featureDefaults when the tenant has no settings_features row and no site_config row yet', async () => {
    getSettingsFeaturesMock.mockResolvedValue(undefined);
    getSiteConfigMock.mockResolvedValue(undefined);

    await setup();

    expect(getSettingsFeaturesMock).toHaveBeenCalledWith('tenant-1');
    expect(screen.getByRole('switch', { name: 'Comments' })).toHaveAttribute(
      'data-checked',
      '',
    );
    expect(screen.getByRole('switch', { name: 'Newsletter' })).toHaveAttribute(
      'data-unchecked',
      '',
    );
  });

  it("renders the tenant's saved settings_features row when one exists", async () => {
    getSettingsFeaturesMock.mockResolvedValue({
      id: 'row-1',
      tenantId: 'tenant-1',
      commentsEnabled: false,
      ratingsEnabled: true,
      bookmarksEnabled: true,
      newsletterEnabled: true,
      analyticsEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await setup({ tenant: buildTenant('GROWTH') });

    expect(getSiteConfigMock).not.toHaveBeenCalled();
    expect(screen.getByRole('switch', { name: 'Comments' })).toHaveAttribute(
      'data-unchecked',
      '',
    );
    expect(screen.getByRole('switch', { name: 'Newsletter' })).toHaveAttribute(
      'data-checked',
      '',
    );
  });

  it('falls back to the EDITORIAL preset featureDefaults when site_config has that preset saved', async () => {
    getSettingsFeaturesMock.mockResolvedValue(undefined);
    getSiteConfigMock.mockResolvedValue({
      preset: PRESET_ID.EDITORIAL,
      accentHue: 28,
      headingFont: 'FRAUNCES',
      bodyFont: 'INTER',
      radiusScale: 'SM',
      density: 'COMPACT',
      logoAssetUrl: undefined,
      faviconAssetUrl: undefined,
    });

    await setup();

    expect(getSiteConfigMock).toHaveBeenCalledWith('tenant-1');
    expect(screen.getByRole('switch', { name: 'Bookmarks' })).toHaveAttribute(
      'data-checked',
      '',
    );
  });

  it('disables the GROWTH-only toggles for a FREE-plan tenant', async () => {
    getSettingsFeaturesMock.mockResolvedValue(undefined);
    getSiteConfigMock.mockResolvedValue(undefined);

    await setup({ tenant: buildTenant('FREE') });

    expect(screen.getByRole('switch', { name: 'Newsletter' })).toHaveAttribute(
      'data-disabled',
      '',
    );
    expect(screen.getByRole('switch', { name: 'Analytics' })).toHaveAttribute(
      'data-disabled',
      '',
    );
  });

  it('clamps a stale out-of-plan value to unchecked+disabled after a downgrade from GROWTH to FREE', async () => {
    getSettingsFeaturesMock.mockResolvedValue({
      id: 'row-1',
      tenantId: 'tenant-1',
      commentsEnabled: true,
      ratingsEnabled: true,
      bookmarksEnabled: true,
      newsletterEnabled: true,
      analyticsEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await setup({ tenant: buildTenant('FREE') });

    const newsletterSwitch = screen.getByRole('switch', {
      name: 'Newsletter',
    });
    expect(newsletterSwitch).toHaveAttribute('data-unchecked', '');
    expect(newsletterSwitch).toHaveAttribute('data-disabled', '');
  });

  it('enables every toggle for a GROWTH-plan tenant', async () => {
    getSettingsFeaturesMock.mockResolvedValue(undefined);
    getSiteConfigMock.mockResolvedValue(undefined);

    await setup({ tenant: buildTenant('GROWTH') });

    expect(
      screen.getByRole('switch', { name: 'Newsletter' }),
    ).not.toHaveAttribute('data-disabled');
    expect(
      screen.getByRole('switch', { name: 'Analytics' }),
    ).not.toHaveAttribute('data-disabled');
  });

  it('passes the archived date through for a deprovisioned tenant', async () => {
    getSettingsFeaturesMock.mockResolvedValue(undefined);
    getSiteConfigMock.mockResolvedValue(undefined);

    const tenant = buildTenant('FREE');
    await setup({
      tenant: {
        ...tenant,
        deprovisionedAt: new Date('2026-08-26T00:00:00.000Z'),
      },
    });

    expect(screen.getByText('This tenant is archived')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });
});
