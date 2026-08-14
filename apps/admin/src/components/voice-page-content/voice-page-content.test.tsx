import { customRenderAsync, screen } from '@admin/testing/custom-render';
import { PRESET_ID } from '@blog/config/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import userEvent from '@testing-library/user-event';

import { VoicePageContent } from './voice-page-content';

const ADVANCED_SUMMARY = 'Advanced — 20 curated strings, 4 groups';

async function openAdvanced() {
  await userEvent.setup().click(screen.getByText(ADVANCED_SUMMARY));
}

const { getSiteConfigMock } = vi.hoisted(() => ({
  getSiteConfigMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: { siteConfig: { getSiteConfig: getSiteConfigMock } },
}));

// `saveVoiceOverridesAction` imports `requireTenantMembership`, which
// imports the real `./auth` module — mocked here (unused by this test
// otherwise) purely so that chain never evaluates the real `NextAuth()`
// call at import time.
vi.mock('@admin/server/auth/auth', () => ({ auth: vi.fn() }));

const tenant: TTenant = {
  id: 'tenant-1',
  slug: 'acme',
  primaryDomain: 'acme.example.com',
  sanityProjectId: 'proj-1',
  sanityDataset: 'production',
  locale: 'en',
  plan: 'FREE',
  status: 'ACTIVE',
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
});
