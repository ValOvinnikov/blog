import { queries } from '@blog/db';
import { MEMBERSHIP_ROLE, TENANT_PLAN } from '@blog/db/constants';
import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import en from '@platform/i18n/messages/en.json';
import { getProjectDomain } from '@platform/server/provisioning/vercel-domains-api';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import {
  MOCK_CLAIM_TOKEN,
  mockCustomDomainClaim,
} from '@platform/testing/custom-domain/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockMembership } from '@platform/testing/memberships/fixtures';
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

vi.mock('@blog/db', () => ({
  queries: {
    tenantDomains: { listTenantDomains: vi.fn() },
    customDomainClaims: { getCustomDomainClaim: vi.fn() },
  },
}));

const { tenantDomainPage } = en;
const { ownDomain } = tenantDomainPage;
const getProjectDomainMock = vi.mocked(getProjectDomain);
const listTenantDomainsMock = vi.mocked(
  queries.tenantDomains.listTenantDomains,
);
const getCustomDomainClaimMock = vi.mocked(
  queries.customDomainClaims.getCustomDomainClaim,
);
const envMock: Partial<Record<keyof typeof env, string>> = env;

const setup = customRenderAsync(DomainPageContent, {
  tenant: mockTenant({ primaryDomain: MOCK_CUSTOM_DOMAIN }),
});

describe(`<${DomainPageContent.name}/>`, () => {
  beforeEach(() => {
    getProjectDomainMock.mockReset();
    listTenantDomainsMock.mockReset().mockResolvedValue([]);
    getCustomDomainClaimMock.mockReset().mockResolvedValue(undefined);
    delete envMock.TENANT_ROOT_DOMAIN;
    getProjectDomainMock.mockResolvedValue({
      status: DOMAIN_VERIFICATION_STATUS.PENDING,
      dnsRecords: [{ type: 'A', name: '@', value: MOCK_VERCEL_A_RECORD }],
    });
  });

  it('shows the title, description and skeleton while Vercel is silent', async () => {
    getProjectDomainMock.mockReturnValue(new Promise(() => {}));

    await setup();

    const title = screen.getByRole('heading', {
      level: 1,
      name: tenantDomainPage.pageTitle,
    });
    const description = screen.getByText(
      'The one piece of setup that is genuinely yours to finish.',
    );
    const skeletons = screen.getAllByTestId('skeleton');
    const cardHeading = screen.queryByRole('heading', {
      level: 2,
      name: tenantDomainPage.cardTitle,
    });

    expect(title).toBeVisible();
    expect(description).toBeVisible();
    expect(skeletons.length).toBeGreaterThan(0);
    expect(cardHeading).not.toBeInTheDocument();
  });

  describe('for a live tenant', () => {
    beforeEach(async () => {
      envMock.TENANT_ROOT_DOMAIN = MOCK_TENANT_ROOT_DOMAIN;
      await setup({
        tenant: mockTenant({ primaryDomain: MOCK_TENANT_DOMAIN }),
      });
    });

    it('replaces the skeleton with the domain card once Vercel answers', async () => {
      const cardHeading = await screen.findByRole('heading', {
        level: 2,
        name: tenantDomainPage.cardTitle,
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
        MOCK_TENANT_DOMAIN,
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
  describe('Use my own domain card', () => {
    const OWN_DOMAIN_TITLE = { level: 2, name: ownDomain.title };
    const growthTenant = (overrides = {}) =>
      mockTenant({
        primaryDomain: MOCK_TENANT_DOMAIN,
        plan: TENANT_PLAN.GROWTH,
        ...overrides,
      });

    beforeEach(() => {
      envMock.TENANT_ROOT_DOMAIN = MOCK_TENANT_ROOT_DOMAIN;
    });

    it('offers a Free tenant the Growth upgrade and no input', async () => {
      await setup({
        tenant: mockTenant({ primaryDomain: MOCK_TENANT_DOMAIN }),
      });

      const heading = screen.getByRole('heading', OWN_DOMAIN_TITLE);
      const prompt = screen.getByText(ownDomain.upgradePrompt);
      const input = screen.queryByRole('textbox');

      expect(heading).toBeVisible();
      expect(prompt).toBeVisible();
      expect(input).not.toBeInTheDocument();
    });

    it('offers a Growth tenant without a custom domain an input and a connect button', async () => {
      await setup({ tenant: growthTenant(), membership: mockMembership() });

      const input = screen.getByRole('textbox', {
        name: ownDomain.domainLabel,
      });
      const connect = screen.getByRole('button', { name: ownDomain.connect });

      expect(input).toBeVisible();
      expect(connect).toBeVisible();
    });

    it('hides the input from a member who is not the owner', async () => {
      await setup({
        tenant: growthTenant(),
        membership: mockMembership({ role: MEMBERSHIP_ROLE.EDITOR }),
      });

      const message = screen.getByText(ownDomain.ownerOnly);
      const input = screen.queryByRole('textbox');

      expect(message).toBeVisible();
      expect(input).not.toBeInTheDocument();
    });

    it('offers an operator the input without a membership', async () => {
      await setup({ tenant: growthTenant(), admin: mockAdmin() });

      const input = screen.getByRole('textbox', {
        name: ownDomain.domainLabel,
      });

      expect(input).toBeVisible();
    });

    it('shows a custom main address once, read-only, without a form', async () => {
      await setup({
        tenant: growthTenant({ primaryDomain: MOCK_CUSTOM_DOMAIN }),
        membership: mockMembership(),
      });

      await screen.findByRole('heading', OWN_DOMAIN_TITLE);
      const remove = screen.queryByRole('button', { name: ownDomain.remove });
      const input = screen.queryByRole('textbox');

      expect(remove).not.toBeInTheDocument();
      expect(input).not.toBeInTheDocument();
      expect(getProjectDomainMock).toHaveBeenCalledExactlyOnceWith(
        MOCK_CUSTOM_DOMAIN,
      );
    });

    it('shows the custom domain with its status and a remove button', async () => {
      listTenantDomainsMock.mockResolvedValue([
        { domain: MOCK_TENANT_DOMAIN },
        { domain: MOCK_CUSTOM_DOMAIN },
      ] as never);

      await setup({ tenant: growthTenant(), membership: mockMembership() });

      const heading = await screen.findByRole('heading', OWN_DOMAIN_TITLE);
      const remove = await screen.findByRole('button', {
        name: ownDomain.remove,
      });
      const textbox = screen.queryByRole('textbox');

      expect(heading).toBeVisible();
      expect(remove).toBeVisible();
      expect(textbox).not.toBeInTheDocument();
      expect(getProjectDomainMock).toHaveBeenCalledWith(MOCK_CUSTOM_DOMAIN);
    });

    it('offers an archived tenant neither an input nor a remove button', async () => {
      listTenantDomainsMock.mockResolvedValue([
        { domain: MOCK_TENANT_DOMAIN },
        { domain: MOCK_CUSTOM_DOMAIN },
      ] as never);

      await setup({
        tenant: growthTenant({ deprovisionedAt: MOCK_ARCHIVED_AT }),
        membership: mockMembership(),
      });

      await screen.findByRole('heading', OWN_DOMAIN_TITLE);
      const remove = screen.queryByRole('button', { name: ownDomain.remove });
      const connect = screen.queryByRole('button', { name: ownDomain.connect });

      expect(remove).not.toBeInTheDocument();
      expect(connect).not.toBeInTheDocument();
    });

    it('tells an archived tenant without a custom domain it cannot be changed', async () => {
      await setup({
        tenant: growthTenant({ deprovisionedAt: MOCK_ARCHIVED_AT }),
        membership: mockMembership(),
      });

      const message = screen.getByText(ownDomain.archivedState);
      const input = screen.queryByRole('textbox');

      expect(message).toBeVisible();
      expect(input).not.toBeInTheDocument();
    });

    it("shows the site's pending claim in place of the connect form", async () => {
      getCustomDomainClaimMock.mockResolvedValue(mockCustomDomainClaim());

      await setup({ tenant: growthTenant(), membership: mockMembership() });

      const token = await screen.findByText(MOCK_CLAIM_TOKEN);
      const connect = screen.queryByRole('button', { name: ownDomain.connect });

      expect(token).toBeVisible();
      expect(connect).not.toBeInTheDocument();
    });
  });
});
