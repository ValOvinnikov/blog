import { ACTION_OUTCOME } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { GITHUB_FAILURE } from '@platform/constants/github';
import type * as releaseConstants from '@platform/constants/release';
import { RELEASE_RUN_STATUS } from '@platform/constants/release';
import { act, customRender, screen } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  mockReleaseCandidate,
  mockReleaseRun,
  MOCK_RELEASE_RUN_URL,
} from '@platform/testing/releases/fixtures';
import userEvent from '@testing-library/user-event';

import { ReleaseCard } from './release-card';

const ARIA_DISABLED = 'aria-disabled';

const { startReleaseActionMock, getReleaseRunActionMock, releaseSwitch } =
  vi.hoisted(() => ({
    startReleaseActionMock: vi.fn(),
    getReleaseRunActionMock: vi.fn(),
    releaseSwitch: { isEnabled: true },
  }));

vi.mock('@platform/constants/release', async (importOriginal) => ({
  ...(await importOriginal<typeof releaseConstants>()),
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
  migrations: mockReleaseCandidate().migrations,
  isOverrideRequired: false,
  releaseRun: okResult(),
});

describe(`<${ReleaseCard.name}/>`, () => {
  let refresh: ReturnType<typeof mockRouterRefresh>;

  beforeEach(() => {
    refresh = mockRouterRefresh();
    releaseSwitch.isEnabled = true;
    startReleaseActionMock
      .mockReset()
      .mockResolvedValue({ outcome: ACTION_OUTCOME.SUCCESS });
    getReleaseRunActionMock.mockReset().mockResolvedValue(okResult());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('says no release has run yet', () => {
    setup();

    const emptyState = screen.getByText('No release has run yet.');

    expect(emptyState).toBeVisible();
  });

  it('shows the latest run with a link to it', () => {
    setup({ releaseRun: okResult(mockReleaseRun()) });

    const status = screen.getByText('Succeeded');
    const runTitle = screen.getByText('Release v1.4.0');
    const runLink = screen.getByRole('link', { name: /View the run/ });

    expect(status).toBeVisible();
    expect(runTitle).toBeVisible();
    expect(runLink).toHaveAttribute('href', MOCK_RELEASE_RUN_URL);
  });

  it('says the deploy did not run and points to the tenant retry when a tenant migration failed', () => {
    setup({
      releaseRun: okResult(
        mockReleaseRun({
          status: RELEASE_RUN_STATUS.FAILED,
          isTenantMigrationFailed: true,
        }),
      ),
    });

    const status = screen.getByText('Failed');
    const failureTitle = screen.getByText('A tenant migration failed');
    const failureHint = screen.getByText(
      'The deploy did not run, so the live site is unchanged. Retry that tenant with Run tenant migrations on this page.',
    );

    expect(status).toBeVisible();
    expect(failureTitle).toBeVisible();
    expect(failureHint).toBeVisible();
  });

  it('refuses a new release while one is running', () => {
    setup({
      releaseRun: okResult(
        mockReleaseRun({ status: RELEASE_RUN_STATUS.RUNNING }),
      ),
    });

    const status = screen.getByText('Running');
    const releaseButton = screen.getByRole('button', { name: 'Release' });
    const refusal = screen.getByText('A release is running.');

    expect(status).toBeVisible();
    expect(releaseButton).toHaveAttribute(ARIA_DISABLED, 'true');
    expect(refusal).toBeVisible();
  });

  it('disables the Release button while production releases are paused', () => {
    releaseSwitch.isEnabled = false;
    setup();

    const releaseButton = screen.getByRole('button', { name: 'Release' });
    const pausedNotice = screen.getByText('Production releases are paused.');

    expect(releaseButton).toHaveAttribute(ARIA_DISABLED, 'true');
    expect(pausedNotice).toBeVisible();
  });

  it('has nothing to release when no commit landed since the last tag', () => {
    setup({ hasChanges: false });

    const noChangesNotice = screen.getByText(
      'Nothing has changed since v1.4.0.',
    );

    expect(noChangesNotice).toBeVisible();
  });

  it('says the release state is unavailable when GitHub cannot be read', () => {
    setup({ releaseRun: errorResult(GITHUB_FAILURE.GITHUB_ERROR) });

    const unavailableNotice = screen.getByText('Release status is unavailable');

    expect(unavailableNotice).toBeVisible();
  });

  it('shows the release as dispatched as soon as it starts', async () => {
    const user = userEvent.setup();
    setup({ releaseRun: okResult(mockReleaseRun()) });

    const openButton = screen.getByRole('button', { name: 'Release' });
    await user.click(openButton);
    const versionInput = await screen.findByRole('textbox', {
      name: 'Version',
    });
    await user.type(versionInput, 'v1.5.0');
    const startButton = screen.getByRole('button', { name: 'Start release' });
    await user.click(startButton);

    const dispatchedStatus = await screen.findByText('Dispatched');
    const startedToast = await screen.findByText('Release started.');
    const releaseButton = screen.getByRole('button', { name: 'Release' });

    expect(dispatchedStatus).toBeVisible();
    expect(startedToast).toBeVisible();
    expect(releaseButton).toHaveAttribute(ARIA_DISABLED, 'true');
  });

  it('follows a running release to its result and refreshes the page', async () => {
    vi.useFakeTimers();
    getReleaseRunActionMock.mockResolvedValue(
      okResult(mockReleaseRun({ status: RELEASE_RUN_STATUS.SUCCEEDED })),
    );
    setup({
      releaseRun: okResult(
        mockReleaseRun({ status: RELEASE_RUN_STATUS.RUNNING }),
      ),
    });

    await act(() => vi.advanceTimersByTimeAsync(10_000));

    const status = screen.getByText('Succeeded');

    expect(status).toBeVisible();
    expect(refresh).toHaveBeenCalledOnce();
  });
});
