import { customRenderAsync, screen } from '@admin/testing/custom-render';
import { PRESET_ID } from '@blog/config';
import type { TTenant } from '@blog/db/schema/tenants';

import { LookPageContent } from './look-page-content';

const { getSiteConfigMock } = vi.hoisted(() => ({
  getSiteConfigMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: { siteConfig: { getSiteConfig: getSiteConfigMock } },
}));

// `LookForm` imports `updateLookAction`, which imports
// `requireTenantMembership`, which imports the real `./auth` module —
// mocked here (unused by this test otherwise) purely so that chain never
// evaluates the real `NextAuth()` call at import time.
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
});
