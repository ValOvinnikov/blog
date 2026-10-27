import { RELEASE_CHANGE } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { GITHUB_FAILURE } from '@platform/constants/github';
import { CONTRAST_STATUS, RELEASE_FAILURE } from '@platform/constants/release';
import { customRender, screen } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  MOCK_LAST_TAG,
  mockComparedCommit,
  mockReleaseCandidate,
} from '@platform/testing/releases/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { ReleasesView } from './releases-view';

const RUN_CONTRAST_CHECK = { name: 'Run contrast check' };

vi.mock('@platform/i18n/navigation');
vi.mock('@platform/server/releases/start-contrast-check-action', () => ({
  startContrastCheckAction: vi.fn(),
}));
vi.mock('@platform/server/releases/start-release-action', () => ({
  startReleaseAction: vi.fn(),
}));
vi.mock('@platform/server/releases/get-release-run-action', () => ({
  getReleaseRunAction: vi.fn(),
}));

const MOCK_COMMIT_SUBJECT = mockComparedCommit().message.split('\n')[0] ?? '';
const NO_CHANGES = mockReleaseCandidate().changes;
const RENDERING_CHANGED = { ...NO_CHANGES, [RELEASE_CHANGE.RENDERING]: true };
const ALL_CHANGED = {
  [RELEASE_CHANGE.RENDERING]: true,
  [RELEASE_CHANGE.DB_MIGRATION]: true,
  [RELEASE_CHANGE.SANITY_MIGRATION]: true,
  [RELEASE_CHANGE.ENV]: true,
};

const setup = customRender(ReleasesView, {
  result: okResult(mockReleaseCandidate()),
  releaseRun: okResult(),
});

describe(`<${ReleasesView.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('lists the commits since the last tag with the touched areas', () => {
    setup({
      result: okResult(mockReleaseCandidate({ changes: RENDERING_CHANGED })),
    });

    const heading = screen.getByRole('heading', { name: 'Releases' });
    const lastTag = screen.getByText(MOCK_LAST_TAG);
    const commit = screen.getByText(MOCK_COMMIT_SUBJECT);
    const touched = screen.getByText('Touched');
    const notTouched = screen.getAllByText('Not touched');

    expect(heading).toBeVisible();
    expect(lastTag).toBeVisible();
    expect(commit).toBeVisible();
    expect(touched).toBeVisible();
    expect(notTouched).toHaveLength(3);
  });

  it('says only the newest commits are shown when the total is larger', () => {
    setup({
      result: okResult(mockReleaseCandidate({ totalCommits: 140 })),
    });

    const notice = screen.getByText('Showing the newest 1 of 140 commits.');

    expect(notice).toBeVisible();
  });

  it('says the change list is incomplete when GitHub truncated the files', () => {
    setup({
      result: okResult(mockReleaseCandidate({ isFileListTruncated: true })),
    });

    const title = screen.getByText('The change list is incomplete');
    const detail = screen.getByText(/at most 300 changed files/);

    expect(title).toBeVisible();
    expect(detail).toBeVisible();
  });

  it('reads each migration count as a minimum when counts are a lower bound', () => {
    setup({
      result: okResult(
        mockReleaseCandidate({
          changes: ALL_CHANGED,
          migrations: {
            contentMigrations: 3,
            tenants: 5,
            dbMigrations: 2,
            isLowerBound: true,
          },
        }),
      ),
    });

    const dbMigrations = screen.getByText('At least 2 migrations to apply');
    const contentMigrations = screen.getByText(
      'At least 3 migrations across 5 projects',
    );

    expect(dbMigrations).toBeVisible();
    expect(contentMigrations).toBeVisible();
  });

  it('reads migration counts exactly when they are not a lower bound', () => {
    setup({
      result: okResult(
        mockReleaseCandidate({
          changes: { ...NO_CHANGES, [RELEASE_CHANGE.DB_MIGRATION]: true },
          migrations: {
            contentMigrations: 0,
            tenants: 0,
            dbMigrations: 1,
            isLowerBound: false,
          },
        }),
      ),
    });

    const dbMigrations = screen.getByText('1 migration to apply');

    expect(dbMigrations).toBeVisible();
  });

  it('shows only the empty message when there are no commits since the tag', () => {
    setup({
      result: okResult(mockReleaseCandidate({ commits: [], totalCommits: 0 })),
    });

    const emptyMessage = screen.getByText(
      `No commits since ${MOCK_LAST_TAG}. Main is at the last release.`,
    );
    const contrastButton = screen.queryByRole('button', RUN_CONTRAST_CHECK);

    expect(emptyMessage).toBeVisible();
    expect(contrastButton).not.toBeInTheDocument();
  });

  it('links a failed contrast status to the findings', () => {
    setup({
      result: okResult(
        mockReleaseCandidate({ contrastStatus: CONTRAST_STATUS.FAILED }),
      ),
    });

    const findingLink = screen.getByRole('link', { name: 'View the finding' });

    expect(findingLink).toHaveAttribute('href', '/findings');
  });

  it('disables the contrast check while a run is in progress', () => {
    setup({
      result: okResult(
        mockReleaseCandidate({ contrastStatus: CONTRAST_STATUS.RUNNING }),
      ),
    });

    const contrastButton = screen.getByRole('button', RUN_CONTRAST_CHECK);

    expect(contrastButton).toBeDisabled();
  });

  it('offers the contrast check when it is not running', () => {
    setup({
      result: okResult(
        mockReleaseCandidate({ contrastStatus: CONTRAST_STATUS.DUE }),
      ),
    });

    const contrastButton = screen.getByRole('button', RUN_CONTRAST_CHECK);

    expect(contrastButton).toBeEnabled();
  });

  it('says GitHub is unreachable and retries by refreshing', async () => {
    const refresh = mockRouterRefresh();
    setup({ result: errorResult(GITHUB_FAILURE.GITHUB_ERROR) });

    const title = screen.getByText('Release information is unavailable');
    const detail = screen.getByText(
      'GitHub could not be reached or answered with an error.',
    );
    const retryButton = screen.getByRole('button', { name: 'Try again' });

    expect(title).toBeVisible();
    expect(detail).toBeVisible();

    await user.click(retryButton);

    expect(refresh).toHaveBeenCalledOnce();
  });

  it('reports an incomplete tag list', () => {
    setup({ result: errorResult(RELEASE_FAILURE.TAG_LIST_INCOMPLETE) });

    const notice = screen.getByText(/too long to read in full/);
    const lastTag = screen.queryByText(MOCK_LAST_TAG);

    expect(notice).toBeVisible();
    expect(lastTag).not.toBeInTheDocument();
  });

  it.each([
    CONTRAST_STATUS.DUE,
    CONTRAST_STATUS.FAILED,
    CONTRAST_STATUS.RUNNING,
  ])(
    'requires an override to release when contrast is %s',
    (contrastStatus) => {
      setup({
        result: okResult(
          mockReleaseCandidate({ changes: RENDERING_CHANGED, contrastStatus }),
        ),
      });

      const overrideButton = screen.getByRole('button', {
        name: 'Release with override',
      });
      const releaseButton = screen.queryByRole('button', { name: 'Release' });

      expect(overrideButton).toBeVisible();
      expect(releaseButton).not.toBeInTheDocument();
    },
  );

  it('releases without an override when contrast passed', () => {
    setup({
      result: okResult(
        mockReleaseCandidate({
          changes: RENDERING_CHANGED,
          contrastStatus: CONTRAST_STATUS.GREEN,
        }),
      ),
    });

    const releaseButton = screen.getByRole('button', { name: 'Release' });

    expect(releaseButton).toBeVisible();
  });
});
