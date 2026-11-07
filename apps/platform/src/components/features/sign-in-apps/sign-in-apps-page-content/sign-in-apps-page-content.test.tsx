import { OAUTH_PROVIDER } from '@blog/config/constants';
import { queries } from '@blog/db';
import { MEMBERSHIP_ROLE, TENANT_PLAN } from '@blog/db/constants';
import en from '@platform/i18n/messages/en.json';
import { buildVirtualAdminMembership } from '@platform/server/auth/build-virtual-admin-membership';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import {
  customRenderAsync,
  screen,
  within,
} from '@platform/testing/custom-render';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import {
  MOCK_CLIENT_ID,
  MOCK_GOOGLE_CALLBACK_URL,
  MOCK_MASKED_CLIENT_ID,
  mockOAuthClient,
} from '@platform/testing/sign-in-apps/fixtures';
import {
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_ID,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import userEvent from '@testing-library/user-event';

import { SignInAppsPageContent } from './sign-in-apps-page-content';

vi.mock('@blog/db', async () => {
  const { mockDbConstants } =
    await import('@platform/testing/mock-db-constants');
  const { mockSignInAppsDb } =
    await import('@platform/testing/sign-in-apps/fixtures');
  return { ...(await mockDbConstants()), ...mockSignInAppsDb() };
});

const page = en.signInAppsPage;
const { growthNote } = en;
const { listTenantOAuthClients } = queries.tenantOAuthCredentials;
const growthTenant = (overrides = {}) =>
  mockTenant({ plan: TENANT_PLAN.GROWTH, ...overrides });

const setup = customRenderAsync(SignInAppsPageContent, {
  tenant: growthTenant(),
  membership: mockMembership(),
});

describe(`<${SignInAppsPageContent.name}/>`, () => {
  beforeEach(() => {
    vi.mocked(listTenantOAuthClients)
      .mockReset()
      .mockResolvedValue([mockOAuthClient()]);
  });

  it('gives a Growth owner one editable card per provider', async () => {
    await setup();

    const cards = screen.getAllByRole('heading', { level: 2 });
    const callback = screen.getByText(MOCK_GOOGLE_CALLBACK_URL);
    const clientIdInputs = screen.getAllByRole('textbox', {
      name: page.clientIdLabel,
    });

    expect(cards.map((card) => card.textContent)).toEqual([
      page.providerName.google,
      page.providerName.github,
    ]);
    expect(callback).toBeVisible();
    expect(clientIdInputs).toHaveLength(2);
  });

  it.each([
    [
      'a member who is not the owner',
      {
        membership: mockMembership({ role: MEMBERSHIP_ROLE.EDITOR }),
      },
      page.notOwnerNotice,
    ],
    [
      'an archived site',
      { tenant: growthTenant({ deprovisionedAt: MOCK_ARCHIVED_AT }) },
      page.archivedNotice,
    ],
  ])(
    'shows %s the notice, the masked client ID and no controls',
    async (_name, overrides, notice) => {
      await setup(overrides);

      const message = screen.getByText(notice);
      const masked = screen.getByDisplayValue(MOCK_MASKED_CLIENT_ID);
      const fullClientId = screen.queryByDisplayValue(MOCK_CLIENT_ID);
      const remove = screen.queryByRole('button', { name: page.remove });
      const replace = screen.queryByRole('button', { name: page.replace });
      expect(message).toBeVisible();
      expect(masked).toBeVisible();
      expect(fullClientId).not.toBeInTheDocument();
      expect(remove).not.toBeInTheDocument();
      expect(replace).not.toBeInTheDocument();
    },
  );

  it.each([
    ['on the operator route', { membership: undefined, admin: mockAdmin() }],
    [
      'through a virtual owner membership',
      {
        membership: buildVirtualAdminMembership(
          mockAdmin().userId,
          MOCK_TENANT_ID,
        ),
      },
    ],
  ])(
    'shows an operator %s only each status and callback address',
    async (_name, access) => {
      await setup(access);

      const pill = screen.getByText(page.ownStatus);
      const callback = screen.getByText(MOCK_GOOGLE_CALLBACK_URL);
      const input = screen.queryByRole('textbox');
      const secretState = screen.queryByText(page.secretSet);
      const link = screen.queryByRole('link');
      expect(pill).toBeVisible();
      expect(callback).toBeVisible();
      expect(input).not.toBeInTheDocument();
      expect(secretState).not.toBeInTheDocument();
      expect(link).not.toBeInTheDocument();
    },
  );

  it('shows an operator on a Free tenant no Growth note', async () => {
    await setup({ tenant: mockTenant(), admin: mockAdmin() });

    const note = screen.queryByText(growthNote.title);

    expect(note).not.toBeInTheDocument();
  });

  it('shows a downgraded site the Free page, keeping its saved app', async () => {
    vi.mocked(listTenantOAuthClients).mockResolvedValue([
      mockOAuthClient({ provider: OAUTH_PROVIDER.GITHUB }),
    ]);

    await setup({ tenant: mockTenant() });

    const note = screen.getByText(growthNote.title);
    const kept = screen.getAllByText(page.keptOnGrowth);
    const shared = screen.getAllByText(page.sharedStatus);
    const input = screen.queryByRole('textbox');
    expect(note).toBeVisible();
    expect(kept).toHaveLength(1);
    expect(shared).toHaveLength(2);
    expect(input).not.toBeInTheDocument();
  });

  it('lists both own apps a Free owner gets on Growth, as plain text', async () => {
    await setup({ tenant: mockTenant() });

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: growthNote.show }));

    const list = screen.getByRole('list', { name: growthNote.listLabel });
    const items = within(list).getAllByRole('listitem');
    const links = within(list).queryAllByRole('link');
    expect(items.map((item) => item.textContent)).toEqual([
      page.growthAddsGoogle,
      page.growthAddsGithub,
    ]);
    expect(links).toHaveLength(0);
  });
});
