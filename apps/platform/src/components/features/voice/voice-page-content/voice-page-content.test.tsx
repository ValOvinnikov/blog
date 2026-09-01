import { PRESET_ID } from '@blog/config/constants';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import userEvent from '@testing-library/user-event';

import { VoicePageContent } from './voice-page-content';

const ADVANCED_SUMMARY = 'Advanced — 19 curated strings, 4 groups';

const openAdvanced = async () => {
  await userEvent.setup().click(screen.getByText(ADVANCED_SUMMARY));
};

const { getSiteConfigMock } = vi.hoisted(() => ({
  getSiteConfigMock: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: { siteConfig: { getSiteConfig: getSiteConfigMock } },
}));

// `saveVoiceOverridesAction` imports `requireTenantMembership`, which
// imports the real `./auth` module — mocked here (unused by this test
// otherwise) purely so that chain never evaluates the real `NextAuth()`
// call at import time.
vi.mock('@platform/server/auth/auth', () => ({ auth: vi.fn() }));

const tenant: TTenant = {
  id: 'tenant-1',
  slug: 'acme',
  name: 'Acme Inc.',
  primaryDomain: 'acme.example.com',
  sanityProjectId: 'proj-1',
  sanityDataset: 'production',
  sanityReadTokenEncrypted: null,
  locale: 'en',
  plan: 'FREE',
  status: 'ACTIVE',
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
  studioVercelProjectId: null,
  seededAt: new Date('2026-01-01T00:00:00.000Z'),
  webhookCreatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deprovisionedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const setup = customRenderAsync(VoicePageContent, { tenant });

describe(`<${VoicePageContent.name}/>`, () => {
  beforeEach(() => {
    getSiteConfigMock.mockReset();
  });

  it('shows every field blank, with CONSOLE placeholders, when the tenant has no site_config row yet', async () => {
    getSiteConfigMock.mockResolvedValue(undefined);

    await setup();
    await openAdvanced();

    expect(
      screen.getByRole('textbox', { name: 'Terminal Prompt Host' }),
    ).toHaveValue('');
    expect(
      screen.getByRole('textbox', { name: 'Terminal Prompt Host' }),
    ).toHaveAttribute('placeholder', '~$');
  });

  it("resolves placeholders from the tenant's actual saved preset, not always CONSOLE", async () => {
    getSiteConfigMock.mockResolvedValue({
      preset: PRESET_ID.EDITORIAL,
      voiceOverrides: {},
    });

    await setup();
    await openAdvanced();

    expect(
      screen.getByRole('textbox', { name: 'Terminal Prompt Host' }),
    ).not.toHaveAttribute('placeholder');
  });

  it('renders a previously-saved override as the field value', async () => {
    getSiteConfigMock.mockResolvedValue({
      preset: PRESET_ID.CONSOLE,
      voiceOverrides: { terminalPromptHost: 'guest@acme' },
    });

    await setup();
    await openAdvanced();

    expect(
      screen.getByRole('textbox', { name: 'Terminal Prompt Host' }),
    ).toHaveValue('guest@acme');
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
