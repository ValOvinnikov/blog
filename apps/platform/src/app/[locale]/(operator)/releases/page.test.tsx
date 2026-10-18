import { ADMIN_ROLE } from '@blog/db/constants';
import { makeAdmin } from '@platform/testing/admins/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { makeReleaseCandidate } from '@platform/testing/releases/fixtures';

import ReleasesPage from './page';

const { requireSuperAdminMock, getReleaseCandidateMock } = vi.hoisted(() => ({
  requireSuperAdminMock: vi.fn(),
  getReleaseCandidateMock: vi.fn(),
}));

vi.mock('@platform/i18n/navigation');

vi.mock('@platform/server/auth/require-super-admin', () => ({
  requireSuperAdmin: requireSuperAdminMock,
}));

vi.mock('@platform/server/releases/get-release-candidate', () => ({
  getReleaseCandidate: getReleaseCandidateMock,
}));

vi.mock('@platform/server/releases/start-contrast-check-action', () => ({
  startContrastCheckAction: vi.fn(),
}));

const setup = customRenderAsync(ReleasesPage, {});

describe(ReleasesPage, () => {
  beforeEach(() => {
    requireSuperAdminMock
      .mockReset()
      .mockResolvedValue(makeAdmin({ role: ADMIN_ROLE.SUPERADMIN }));
    getReleaseCandidateMock.mockReset();
  });

  it('renders the release candidate for a super-admin', async () => {
    getReleaseCandidateMock.mockResolvedValue({
      ok: true,
      data: makeReleaseCandidate(),
    });

    await setup();

    expect(screen.getByText('feat(web): add a thing')).toBeVisible();
  });

  it('says the release information is unavailable when the read fails', async () => {
    getReleaseCandidateMock.mockResolvedValue({
      ok: false,
      reason: 'rateLimited',
    });

    await setup();

    expect(
      screen.getByText('Release information is unavailable'),
    ).toBeVisible();
  });

  it('reads nothing when the caller is not a super-admin', async () => {
    requireSuperAdminMock.mockRejectedValue(new Error('NEXT_NOT_FOUND'));

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(getReleaseCandidateMock).not.toHaveBeenCalled();
  });
});
