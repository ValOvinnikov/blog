import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import { getProjectDomain } from '@platform/server/provisioning/vercel-domains-api';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { ARCHIVED_NOTICE_TEXT } from '@platform/testing/render-in-settings-form';
import {
  mockTenant,
  MOCK_ARCHIVED_AT,
  MOCK_CUSTOM_DOMAIN,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ROOT_DOMAIN,
  MOCK_VERCEL_A_RECORD,
} from '@platform/testing/tenants/fixtures';
import { env } from '@platform/utils/env/env';

import { DomainPageContent } from './domain-page-content';

vi.mock('@platform/server/provisioning/vercel-domains-api', () => ({
  getProjectDomain: vi.fn(),
}));

vi.mock('@platform/utils/env/env');

const getProjectDomainMock = vi.mocked(getProjectDomain);
const envMock: Partial<Record<keyof typeof env, string>> = env;

const setup = customRenderAsync(DomainPageContent, {
  tenant: mockTenant({ primaryDomain: MOCK_CUSTOM_DOMAIN }),
});

describe(`<${DomainPageContent.name}/>`, () => {
  beforeEach(() => {
    getProjectDomainMock.mockReset();
    delete envMock.TENANT_ROOT_DOMAIN;
    getProjectDomainMock.mockResolvedValue({
      status: DOMAIN_VERIFICATION_STATUS.PENDING,
      dnsRecords: [{ type: 'A', name: '@', value: MOCK_VERCEL_A_RECORD }],
    });
  });

  it('shows the title, description and skeleton while Vercel is silent', async () => {
    getProjectDomainMock.mockReturnValue(new Promise(() => {}));

    await setup();

    const title = screen.getByRole('heading', { level: 1, name: 'Domain' });
    const description = screen.getByText(
      'The one piece of setup that is genuinely yours to finish.',
    );
    const skeletons = screen.getAllByTestId('skeleton');
    const cardHeading = screen.queryByRole('heading', { level: 2 });

    expect(title).toBeVisible();
    expect(description).toBeVisible();
    expect(skeletons.length).toBeGreaterThan(0);
    expect(cardHeading).not.toBeInTheDocument();
  });

  describe('for a live tenant', () => {
    beforeEach(async () => {
      await setup();
    });

    it('replaces the skeleton with the domain card once Vercel answers', async () => {
      const cardHeading = await screen.findByRole('heading', {
        level: 2,
        name: 'Your domain',
      });
      const statusBadge = screen.getByText('Awaiting DNS');
      const skeleton = screen.queryByTestId('skeleton');

      expect(cardHeading).toBeVisible();
      expect(statusBadge).toBeVisible();
      expect(skeleton).not.toBeInTheDocument();
    });

    it('loads the domain from Vercel exactly once', async () => {
      await screen.findByRole('table');

      expect(getProjectDomainMock).toHaveBeenCalledExactlyOnceWith(
        MOCK_CUSTOM_DOMAIN,
      );
    });

    it('does not show the archived notice for a live tenant', () => {
      const archivedNotice = screen.queryByText(ARCHIVED_NOTICE_TEXT);

      expect(archivedNotice).not.toBeInTheDocument();
    });
  });

  it('names a verified subdomain of the root domain as a platform address', async () => {
    envMock.TENANT_ROOT_DOMAIN = MOCK_TENANT_ROOT_DOMAIN;
    getProjectDomainMock.mockResolvedValue({
      status: DOMAIN_VERIFICATION_STATUS.VERIFIED,
      dnsRecords: [],
    });

    await setup({ tenant: mockTenant({ primaryDomain: MOCK_TENANT_DOMAIN }) });

    const domainType = await screen.findByText('Platform address');

    expect(domainType).toBeVisible();
  });

  it('shows the archived notice for a deprovisioned tenant', async () => {
    await setup({
      tenant: mockTenant({
        primaryDomain: MOCK_CUSTOM_DOMAIN,
        deprovisionedAt: MOCK_ARCHIVED_AT,
      }),
    });

    const archivedNotice = screen.getByText(ARCHIVED_NOTICE_TEXT);

    expect(archivedNotice).toBeVisible();
  });
});
