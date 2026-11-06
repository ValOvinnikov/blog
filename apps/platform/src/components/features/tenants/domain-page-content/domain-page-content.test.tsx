import { OAUTH_PROVIDER } from '@blog/config/constants';
import { queries } from '@blog/db';
import { MEMBERSHIP_ROLE, TENANT_PLAN } from '@blog/db/constants';
import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import en from '@platform/i18n/messages/en.json';
import { getProjectDomain } from '@platform/server/provisioning/vercel-domains-api';
import { listOwnSignInAppProviders } from '@platform/server/sign-in-apps/list-own-sign-in-app-providers';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import {
  MOCK_CLAIM_TOKEN,
  mockCustomDomainClaim,
  mockTenantDomainRows,
} from '@platform/testing/custom-domain/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockPendingProjectDomain } from '@platform/testing/domains/fixtures';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { ARCHIVED_NOTICE_TEXT } from '@platform/testing/render-in-settings-form';
import {
  mockTenant,
  MOCK_ARCHIVED_AT,
  MOCK_CUSTOM_DOMAIN,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ROOT_DOMAIN,
} from '@platform/testing/tenants/fixtures';
import { env } from '@platform/utils/env/env';
import userEvent from '@testing-library/user-event';

import { DomainPageContent } from './domain-page-content';

vi.mock('@platform/server/provisioning/vercel-domains-api', () => ({
  getProjectDomain: vi.fn(),
}));

vi.mock('@platform/utils/env/env');

vi.mock('@platform/server/sign-in-apps/list-own-sign-in-app-providers', () => ({
  listOwnSignInAppProviders: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: {
    tenantDomains: { listTenantDomains: vi.fn() },
    customDomainClaims: { getCustomDomainClaim: vi.fn() },
  },
}));

const { tenantDomainPage, signInAppsPage } = en;
const { google: GOOGLE_NAME, github: GITHUB_NAME } =
  signInAppsPage.providerName;
const { ownDomain } = tenantDomainPage;
const getProjectDomainMock = vi.mocked(getProjectDomain);
const listTenantDomainsMock = vi.mocked(
  queries.tenantDomains.listTenantDomains,
);
const getCustomDomainClaimMock = vi.mocked(
  queries.customDomainClaims.getCustomDomainClaim,
);
const listOwnSignInAppProvidersMock = vi.mocked(listOwnSignInAppProviders);
const tMainAddress = makeEnTranslator('tenantDomainPage.ownDomain.mainAddress');
const envMock: Partial<Record<keyof typeof env, string>> = env;
const SUBDOMAIN_NOTE = makeEnTranslator('tenantDomainPage.ownDomain')(
  'subdomainStillWorks',
  { subdomain: MOCK_TENANT_DOMAIN },
);

const setup = customRenderAsync(DomainPageContent, {
  tenant: mockTenant({ primaryDomain: MOCK_CUSTOM_DOMAIN }),
});

describe(`<${DomainPageContent.name}/>`, () => {
  beforeEach(() => {
    getProjectDomainMock.mockReset();
    listTenantDomainsMock.mockReset().mockResolvedValue([]);
    getCustomDomainClaimMock.mockReset().mockResolvedValue(undefined);
    listOwnSignInAppProvidersMock.mockReset().mockResolvedValue([]);
    delete envMock.TENANT_ROOT_DOMAIN;
    getProjectDomainMock.mockResolvedValue(mockPendingProjectDomain());
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
    const renderForOwner = (tenantOverrides = {}) =>
      setup({
        tenant: growthTenant(tenantOverrides),
        membership: mockMembership(),
      });

    const expectNoticeWithoutInput = (notice: string) => {
      const message = screen.getByText(notice);
      const input = screen.queryByRole('textbox');
      expect(message).toBeVisible();
      expect(input).not.toBeInTheDocument();
    };
    const expectDomainInput = () => {
      const input = screen.getByRole('textbox', {
        name: ownDomain.domainLabel,
      });
      expect(input).toBeVisible();
    };

    beforeEach(() => {
      envMock.TENANT_ROOT_DOMAIN = MOCK_TENANT_ROOT_DOMAIN;
    });

    it('offers a Free tenant the Growth upgrade and no input', async () => {
      await setup({
        tenant: mockTenant({ primaryDomain: MOCK_TENANT_DOMAIN }),
      });

      const heading = screen.getByRole('heading', OWN_DOMAIN_TITLE);

      expect(heading).toBeVisible();
      expectNoticeWithoutInput(ownDomain.upgradePrompt);
    });

    it('offers a Growth tenant without a custom domain an input and a connect button', async () => {
      await renderForOwner();

      const connect = screen.getByRole('button', { name: ownDomain.connect });

      expectDomainInput();
      expect(connect).toBeVisible();
    });

    it('hides the input from a member who is not the owner', async () => {
      await setup({
        tenant: growthTenant(),
        membership: mockMembership({ role: MEMBERSHIP_ROLE.EDITOR }),
      });

      expectNoticeWithoutInput(ownDomain.ownerOnly);
    });

    it('offers an operator the input without a membership', async () => {
      await setup({ tenant: growthTenant(), admin: mockAdmin() });

      expectDomainInput();
    });

    it('shows a custom main address once, with the way back and without a form', async () => {
      await renderForOwner({ primaryDomain: MOCK_CUSTOM_DOMAIN });

      await screen.findByRole('heading', {
        level: 2,
        name: ownDomain.mainTitle,
      });
      const remove = screen.queryByRole('button', { name: ownDomain.remove });
      const input = screen.queryByRole('textbox');
      const switchBack = screen.getByRole('button', {
        name: ownDomain.mainAddress.useSubdomain.trigger,
      });

      expect(remove).not.toBeInTheDocument();
      expect(input).not.toBeInTheDocument();
      expect(switchBack).toBeVisible();
      expect(getProjectDomainMock).toHaveBeenCalledExactlyOnceWith(
        MOCK_CUSTOM_DOMAIN,
      );
    });

    describe('switching the main address on a site with its own sign-in apps', () => {
      const openSwitchBack = async () => {
        const user = userEvent.setup();
        await renderForOwner({ primaryDomain: MOCK_CUSTOM_DOMAIN });
        const switchBack = await screen.findByRole('button', {
          name: ownDomain.mainAddress.useSubdomain.trigger,
        });
        await user.click(switchBack);
        return screen.findByRole('alertdialog');
      };

      it('warns in the confirmation, naming the one provider with an app', async () => {
        listOwnSignInAppProvidersMock.mockResolvedValue([
          OAUTH_PROVIDER.GOOGLE,
        ]);

        const dialog = await openSwitchBack();

        expect(dialog).toHaveTextContent(
          tMainAddress('signInAppsWarningOne', { provider: GOOGLE_NAME }),
        );
      });

      it('names both providers when both have an app', async () => {
        listOwnSignInAppProvidersMock.mockResolvedValue([
          OAUTH_PROVIDER.GOOGLE,
          OAUTH_PROVIDER.GITHUB,
        ]);

        const dialog = await openSwitchBack();

        expect(dialog).toHaveTextContent(
          tMainAddress('signInAppsWarningMany', {
            providers: `${GOOGLE_NAME} and ${GITHUB_NAME}`,
          }),
        );
      });

      it('keeps the usual confirmation for a site with no app of its own', async () => {
        const dialog = await openSwitchBack();
        const warning = screen.queryByRole('note');

        expect(dialog).toBeVisible();
        expect(warning).not.toBeInTheDocument();
      });
    });

    describe('with the subdomain and a custom domain connected', () => {
      beforeEach(() => {
        listTenantDomainsMock.mockResolvedValue(mockTenantDomainRows());
      });

      it.each([
        { viewer: 'the owner', access: { membership: mockMembership() } },
        { viewer: 'an operator', access: { admin: mockAdmin() } },
      ])(
        'names the subdomain that still works under a custom main address for $viewer',
        async ({ access }) => {
          await setup({
            tenant: growthTenant({ primaryDomain: MOCK_CUSTOM_DOMAIN }),
            ...access,
          });

          const note = await screen.findByText(SUBDOMAIN_NOTE);

          expect(note).toBeVisible();
        },
      );

      it('shows the custom domain with its status and a remove button', async () => {
        await renderForOwner();

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
        await renderForOwner({ deprovisionedAt: MOCK_ARCHIVED_AT });

        await screen.findByRole('heading', OWN_DOMAIN_TITLE);
        const remove = screen.queryByRole('button', { name: ownDomain.remove });
        const connect = screen.queryByRole('button', {
          name: ownDomain.connect,
        });

        expect(remove).not.toBeInTheDocument();
        expect(connect).not.toBeInTheDocument();
      });
    });

    it('tells an archived tenant without a custom domain it cannot be changed', async () => {
      await renderForOwner({ deprovisionedAt: MOCK_ARCHIVED_AT });

      expectNoticeWithoutInput(ownDomain.archivedState);
    });

    it("shows the site's pending claim in place of the connect form", async () => {
      getCustomDomainClaimMock.mockResolvedValue(mockCustomDomainClaim());

      await renderForOwner();

      const token = await screen.findByText(MOCK_CLAIM_TOKEN);
      const connect = screen.queryByRole('button', { name: ownDomain.connect });

      expect(token).toBeVisible();
      expect(connect).not.toBeInTheDocument();
    });
  });
});
