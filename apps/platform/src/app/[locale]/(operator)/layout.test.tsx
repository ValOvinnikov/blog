import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { ADMIN_ROLE } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import messages from '@platform/i18n/messages/en.json';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { useGitHubFetch } from '@platform/testing/github/github-fetch';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { respondWithDueContrastCheck } from '@platform/testing/releases/contrast-due-github';
import { adminRoutes } from '@platform/utils/routes/routes';

import OperatorLayout from './layout';

faker.seed(5996);

const { getAdminByUserIdMock } = vi.hoisted(() => ({
  getAdminByUserIdMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/layout/resolve-is-sidebar-collapsed');

vi.mock('@platform/utils/env/env');

vi.mock('@platform/i18n/navigation');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    admins: { getAdminByUserId: getAdminByUserIdMock },
    findings: {
      getContrastFinding: vi.fn(),
      getLatestPassingContrastSha: vi.fn(),
    },
  },
}));

const MOCK_CONTENT = faker.lorem.sentence();

const setup = customRenderAsync(OperatorLayout, {
  children: <p>{MOCK_CONTENT}</p>,
});

describe(`<${OperatorLayout.name}/>`, () => {
  const github = useGitHubFetch();

  beforeEach(() => {
    getAdminByUserIdMock.mockReset();
  });

  it('404s a signed-in user with no admins row', async () => {
    getAdminByUserIdMock.mockResolvedValueOnce(undefined);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
  });

  it('renders the gated content for a signed-in admin', async () => {
    getAdminByUserIdMock.mockResolvedValueOnce(mockAdmin());

    await setup();

    const content = screen.getByText(MOCK_CONTENT);

    expect(content).toBeVisible();
  });

  it("builds the sidebar from the admin's role", async () => {
    getAdminByUserIdMock.mockResolvedValueOnce(
      mockAdmin({ role: ADMIN_ROLE.SUPERADMIN }),
    );

    await setup();

    const releasesLink = screen.getByRole('link', {
      name: messages.navSections.releases,
    });

    expect(releasesLink).toHaveAttribute('href', adminRoutes.releases());
  });

  describe('when a contrast check is due', () => {
    beforeEach(() => {
      respondWithDueContrastCheck(github);
    });

    it('warns a SUPERADMIN that a contrast check is due', async () => {
      getAdminByUserIdMock.mockResolvedValueOnce(
        mockAdmin({ role: ADMIN_ROLE.SUPERADMIN }),
      );

      await setup();

      const banner = await screen.findByText(messages.contrastDueBanner.title);

      expect(banner).toBeVisible();
    });

    it.each([ADMIN_ROLE.ADMIN, ADMIN_ROLE.MODERATOR])(
      'never warns an %s that a contrast check is due',
      async (role) => {
        getAdminByUserIdMock.mockResolvedValueOnce(mockAdmin({ role }));

        await setup();

        const content = screen.getByText(MOCK_CONTENT);
        const banner = screen.queryByText(messages.contrastDueBanner.title);

        expect(content).toBeVisible();
        expect(banner).not.toBeInTheDocument();
      },
    );
  });
});
