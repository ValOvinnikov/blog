import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { ADMIN_ROLE } from '@blog/db/constants';
import { errorResult, okResult } from '@blog/utils';
import { makeAdmin } from '@platform/testing/admins/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import {
  makeReleaseCandidate,
  makeReleaseRun,
} from '@platform/testing/releases/fixtures';

import ReleasesPage from './page';

const { requireSuperAdminMock, getReleaseCandidateMock, getReleaseRunMock } =
  vi.hoisted(() => ({
    requireSuperAdminMock: vi.fn(),
    getReleaseCandidateMock: vi.fn(),
    getReleaseRunMock: vi.fn(),
  }));

vi.mock('@platform/i18n/navigation');

vi.mock('@platform/server/auth/require-super-admin', () => ({
  requireSuperAdmin: requireSuperAdminMock,
}));

vi.mock('@platform/server/releases/get-release-candidate', () => ({
  getReleaseCandidate: getReleaseCandidateMock,
}));

vi.mock('@platform/server/releases/get-release-run', () => ({
  getReleaseRun: getReleaseRunMock,
}));

vi.mock('@platform/server/releases/start-contrast-check-action', () => ({
  startContrastCheckAction: vi.fn(),
}));

vi.mock('@platform/server/releases/start-release-action', () => ({
  startReleaseAction: vi.fn(),
}));

vi.mock('@platform/server/releases/get-release-run-action', () => ({
  getReleaseRunAction: vi.fn(),
}));

const setup = customRenderAsync(ReleasesPage, {});

describe(ReleasesPage, () => {
  beforeEach(() => {
    requireSuperAdminMock
      .mockReset()
      .mockResolvedValue(makeAdmin({ role: ADMIN_ROLE.SUPERADMIN }));
    getReleaseCandidateMock.mockReset();
    getReleaseRunMock.mockReset().mockResolvedValue(okResult(makeReleaseRun()));
  });

  it('renders the release candidate for a super-admin', async () => {
    getReleaseCandidateMock.mockResolvedValue(okResult(makeReleaseCandidate()));

    await setup();

    expect(screen.getByText('feat(web): add a thing')).toBeVisible();
    expect(screen.getByText('Release v1.4.0')).toBeVisible();
  });

  it('says the release information is unavailable when the read fails', async () => {
    getReleaseCandidateMock.mockResolvedValue(errorResult('rateLimited'));

    await setup();

    expect(
      screen.getByText('Release information is unavailable'),
    ).toBeVisible();
  });

  it('reads nothing when the caller is not a super-admin', async () => {
    requireSuperAdminMock.mockRejectedValue(
      new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND),
    );

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(getReleaseCandidateMock).not.toHaveBeenCalled();
    expect(getReleaseRunMock).not.toHaveBeenCalled();
  });
});
