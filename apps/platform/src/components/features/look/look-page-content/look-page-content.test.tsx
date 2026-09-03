import { PRESET_ID } from '@blog/config';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { makeTenant } from '@platform/testing/tenants/fixtures';

import { LookPageContent } from './look-page-content';

const { getSiteConfigMock } = vi.hoisted(() => ({
  getSiteConfigMock: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: { siteConfig: { getSiteConfig: getSiteConfigMock } },
}));

// `LookForm` imports `updateLookAction`, which imports
// `requireTenantMembership`, which imports the real `./auth` module —
// mocked here (unused by this test otherwise) purely so that chain never
// evaluates the real `NextAuth()` call at import time.
vi.mock('@platform/server/auth/auth', () => ({ auth: vi.fn() }));

const tenant = makeTenant({
  sanityProjectId: 'proj-1',
  sanityDataset: 'production',
  locale: 'en',
  provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
  provisioningSteps: {
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
  },
  seededAt: new Date('2026-01-01T00:00:00.000Z'),
  webhookCreatedAt: new Date('2026-01-01T00:00:00.000Z'),
});

const setup = customRenderAsync(LookPageContent, { tenant });

describe(`<${LookPageContent.name}/>`, () => {
  beforeEach(() => {
    getSiteConfigMock.mockReset();
  });

  it('renders Console defaults when the tenant has no saved site_config row yet', async () => {
    getSiteConfigMock.mockResolvedValue(undefined);

    await setup();

    expect(getSiteConfigMock).toHaveBeenCalledWith('tenant-1');
    expect(screen.getByRole('heading', { name: 'Look' })).toBeVisible();
    expect(screen.getByRole('radio', { name: 'Console' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it("renders the tenant's saved site_config row when one exists", async () => {
    getSiteConfigMock.mockResolvedValue({
      id: 'config-1',
      tenantId: 'tenant-1',
      preset: PRESET_ID.EDITORIAL,
      accentHue: 28,
      logoHue: undefined,
      headingFont: 'FRAUNCES',
      bodyFont: 'INTER',
      radiusScale: 'SM',
      density: 'COMPACT',
      logoAssetUrl: undefined,
      faviconAssetUrl: undefined,
      voiceOverrides: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await setup();

    expect(screen.getByRole('radio', { name: 'Editorial' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByText('28°')).toBeVisible();
  });

  it('passes the archived date through for a deprovisioned tenant', async () => {
    getSiteConfigMock.mockResolvedValue(undefined);

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
