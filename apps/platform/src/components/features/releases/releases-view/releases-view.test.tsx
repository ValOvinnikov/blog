import { RELEASE_CHANGE } from '@blog/config';
import { CONTRAST_STATUS } from '@platform/constants/release';
import { customRender, screen } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  makeComparedCommit,
  makeReleaseCandidate,
} from '@platform/testing/releases/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { ReleasesView } from './releases-view';

vi.mock('@platform/i18n/navigation');
vi.mock('@platform/server/releases/start-contrast-check-action', () => ({
  startContrastCheckAction: vi.fn(),
}));

const setup = customRender(ReleasesView, {
  result: { ok: true, data: makeReleaseCandidate() },
});

describe(`<${ReleasesView.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('lists the commits since the last tag with the touched areas', () => {
    setup({
      result: {
        ok: true,
        data: makeReleaseCandidate({
          changes: {
            [RELEASE_CHANGE.RENDERING]: true,
            [RELEASE_CHANGE.DB_MIGRATION]: false,
            [RELEASE_CHANGE.SANITY_MIGRATION]: false,
            [RELEASE_CHANGE.ENV]: false,
          },
        }),
      },
    });

    expect(screen.getByRole('heading', { name: 'Releases' })).toBeVisible();
    expect(screen.getByText('v1.4.0')).toBeVisible();
    expect(screen.getByText('feat(web): add a thing')).toBeVisible();
    expect(screen.getByText('Touched')).toBeVisible();
    expect(screen.getAllByText('Not touched')).toHaveLength(3);
  });

  it('says the commit list shows only the newest when it is shorter than the total', () => {
    setup({
      result: {
        ok: true,
        data: makeReleaseCandidate({ totalCommits: 140 }),
      },
    });

    expect(
      screen.getByText('Showing the newest 1 of 140 commits.'),
    ).toBeVisible();
  });

  it('says the change list is incomplete when GitHub truncated the files', () => {
    setup({
      result: {
        ok: true,
        data: makeReleaseCandidate({ isFileListTruncated: true }),
      },
    });

    expect(screen.getByText('The change list is incomplete')).toBeVisible();
    expect(screen.getByText(/at most 300 changed files/)).toBeVisible();
  });

  it('reads each migration count as a minimum when the counts are a lower bound', () => {
    setup({
      result: {
        ok: true,
        data: makeReleaseCandidate({
          changes: {
            [RELEASE_CHANGE.RENDERING]: true,
            [RELEASE_CHANGE.DB_MIGRATION]: true,
            [RELEASE_CHANGE.SANITY_MIGRATION]: true,
            [RELEASE_CHANGE.ENV]: true,
          },
          migrations: {
            contentMigrations: 3,
            tenants: 5,
            dbMigrations: 2,
            isLowerBound: true,
          },
        }),
      },
    });

    expect(screen.getByText('At least 2 migrations to apply')).toBeVisible();
    expect(
      screen.getByText('At least 3 migrations across 5 projects'),
    ).toBeVisible();
  });

  it('reads migration counts exactly when they are not a lower bound', () => {
    setup({
      result: {
        ok: true,
        data: makeReleaseCandidate({
          changes: {
            [RELEASE_CHANGE.RENDERING]: false,
            [RELEASE_CHANGE.DB_MIGRATION]: true,
            [RELEASE_CHANGE.SANITY_MIGRATION]: false,
            [RELEASE_CHANGE.ENV]: false,
          },
          migrations: {
            contentMigrations: 0,
            tenants: 0,
            dbMigrations: 1,
            isLowerBound: false,
          },
        }),
      },
    });

    expect(screen.getByText('1 migration to apply')).toBeVisible();
  });

  it('shows only the empty message when there are no commits since the tag', () => {
    setup({
      result: {
        ok: true,
        data: makeReleaseCandidate({ commits: [], totalCommits: 0 }),
      },
    });

    expect(
      screen.getByText('No commits since v1.4.0. Main is at the last release.'),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Run contrast check' }),
    ).not.toBeInTheDocument();
  });

  it('links a failed contrast status to the findings', () => {
    setup({
      result: {
        ok: true,
        data: makeReleaseCandidate({
          commits: [makeComparedCommit()],
          contrastStatus: CONTRAST_STATUS.FAILED,
        }),
      },
    });

    expect(
      screen.getByRole('link', { name: 'View the finding' }),
    ).toHaveAttribute('href', '/findings');
  });

  it('disables the contrast check while a run is in progress', () => {
    setup({
      result: {
        ok: true,
        data: makeReleaseCandidate({ contrastStatus: CONTRAST_STATUS.RUNNING }),
      },
    });

    expect(
      screen.getByRole('button', { name: 'Run contrast check' }),
    ).toBeDisabled();
  });

  it('offers the contrast check when it is not running', () => {
    setup({
      result: {
        ok: true,
        data: makeReleaseCandidate({ contrastStatus: CONTRAST_STATUS.DUE }),
      },
    });

    expect(
      screen.getByRole('button', { name: 'Run contrast check' }),
    ).toBeEnabled();
  });

  it('says GitHub is unreachable and retries by refreshing', async () => {
    const refresh = mockRouterRefresh();
    setup({ result: { ok: false, reason: 'githubError' } });

    expect(
      screen.getByText('Release information is unavailable'),
    ).toBeVisible();
    expect(
      screen.getByText(
        'GitHub could not be reached or answered with an error.',
      ),
    ).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(refresh).toHaveBeenCalledOnce();
  });

  it('reports an incomplete tag list instead of a latest release', () => {
    setup({ result: { ok: false, reason: 'tagListIncomplete' } });

    expect(screen.getByText(/too long to read in full/)).toBeVisible();
    expect(screen.queryByText('v1.4.0')).not.toBeInTheDocument();
  });
});
