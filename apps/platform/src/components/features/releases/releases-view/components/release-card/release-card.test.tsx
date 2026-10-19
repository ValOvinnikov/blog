import { ACTION_OUTCOME } from '@blog/config';
import { RELEASE_RUN_STATUS } from '@platform/constants/release';
import { act, customRender, screen } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  makeReleaseCandidate,
  makeReleaseRun,
} from '@platform/testing/releases/fixtures';
import userEvent from '@testing-library/user-event';

import { ReleaseCard } from './release-card';

const { startReleaseActionMock, getReleaseRunActionMock, releaseSwitch } =
  vi.hoisted(() => ({
    startReleaseActionMock: vi.fn(),
    getReleaseRunActionMock: vi.fn(),
    releaseSwitch: { isEnabled: true },
  }));

vi.mock('@platform/constants/release', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@platform/constants/release')>()),
  get IS_PRODUCTION_RELEASE_ENABLED() {
    return releaseSwitch.isEnabled;
  },
}));

vi.mock('@platform/server/releases/start-release-action', () => ({
  startReleaseAction: startReleaseActionMock,
}));

vi.mock('@platform/server/releases/get-release-run-action', () => ({
  getReleaseRunAction: getReleaseRunActionMock,
}));

const setup = customRender(ReleaseCard, {
  lastTag: 'v1.4.0',
  hasChanges: true,
  migrations: makeReleaseCandidate().migrations,
  isOverrideRequired: false,
  releaseRun: { ok: true, data: undefined },
});

describe(`<${ReleaseCard.name}/>`, () => {
  let refresh: ReturnType<typeof mockRouterRefresh>;

  beforeEach(() => {
    refresh = mockRouterRefresh();
    releaseSwitch.isEnabled = true;
    startReleaseActionMock
      .mockReset()
      .mockResolvedValue({ outcome: ACTION_OUTCOME.SUCCESS });
    getReleaseRunActionMock
      .mockReset()
      .mockResolvedValue({ ok: true, data: undefined });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('says no release has run yet', () => {
    setup();

    expect(screen.getByText('No release has run yet.')).toBeVisible();
  });

  it('shows the latest run with a link to it', () => {
    setup({ releaseRun: { ok: true, data: makeReleaseRun() } });

    expect(screen.getByText('Succeeded')).toBeVisible();
    expect(screen.getByText('Release v1.4.0')).toBeVisible();
    expect(screen.getByRole('link', { name: /View the run/ })).toHaveAttribute(
      'href',
      'https://github.com/acme/blog/actions/runs/42',
    );
  });

  it('says the deploy did not run and points to the tenant retry when a tenant migration failed', () => {
    setup({
      releaseRun: {
        ok: true,
        data: makeReleaseRun({
          status: RELEASE_RUN_STATUS.FAILED,
          isTenantMigrationFailed: true,
        }),
      },
    });

    expect(screen.getByText('Failed')).toBeVisible();
    expect(screen.getByText('A tenant migration failed')).toBeVisible();
    expect(
      screen.getByText(
        'The deploy did not run, so the live site is unchanged. Retry that tenant with Run tenant migrations on this page.',
      ),
    ).toBeVisible();
  });

  it('refuses a new release while one is running', () => {
    setup({
      releaseRun: {
        ok: true,
        data: makeReleaseRun({ status: RELEASE_RUN_STATUS.RUNNING }),
      },
    });

    expect(screen.getByText('Running')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Release' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByText('A release is running.')).toBeVisible();
  });

  it('disables the Release button while production releases are paused', () => {
    releaseSwitch.isEnabled = false;
    setup();

    expect(screen.getByRole('button', { name: 'Release' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByText('Production releases are paused.')).toBeVisible();
  });

  it('has nothing to release when no commit landed since the last tag', () => {
    setup({ hasChanges: false });

    expect(screen.getByText('Nothing has changed since v1.4.0.')).toBeVisible();
  });

  it('says the release state is unavailable when GitHub cannot be read', () => {
    setup({ releaseRun: { ok: false, reason: 'githubError' } });

    expect(screen.getByText('Release status is unavailable')).toBeVisible();
  });

  it('shows the release as dispatched as soon as it starts', async () => {
    const user = userEvent.setup();
    setup({ releaseRun: { ok: true, data: makeReleaseRun() } });

    await user.click(screen.getByRole('button', { name: 'Release' }));
    await user.type(
      await screen.findByRole('textbox', { name: 'Version' }),
      'v1.5.0',
    );
    await user.click(screen.getByRole('button', { name: 'Start release' }));

    expect(await screen.findByText('Dispatched')).toBeVisible();
    expect(await screen.findByText('Release started.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Release' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('follows a running release to its result and refreshes the page', async () => {
    vi.useFakeTimers();
    getReleaseRunActionMock.mockResolvedValue({
      ok: true,
      data: makeReleaseRun({ status: RELEASE_RUN_STATUS.SUCCEEDED }),
    });
    setup({
      releaseRun: {
        ok: true,
        data: makeReleaseRun({ status: RELEASE_RUN_STATUS.RUNNING }),
      },
    });

    await act(() => vi.advanceTimersByTimeAsync(10_000));

    expect(screen.getByText('Succeeded')).toBeVisible();
    expect(refresh).toHaveBeenCalledOnce();
  });
});
