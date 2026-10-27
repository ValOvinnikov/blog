import { RELEASE_CHANGE } from '@blog/config';
import {
  CONTRAST_STATUS,
  RELEASE_RUN_STATUS,
} from '@platform/constants/release';
import type { TComparedCommit } from '@platform/server/github/compare-commits';
import type { TReleaseCandidate } from '@platform/server/releases/get-release-candidate';
import type { TReleaseRun } from '@platform/server/releases/get-release-run';

const RELEASE_AT = '2026-04-02T10:00:00.000Z';

export const MOCK_RELEASE_LAST_TAG = 'v1.4.0';

export const mockComparedCommit = (
  overrides: Partial<TComparedCommit> = {},
): TComparedCommit => ({
  sha: 'abcdef0123456789abcdef0123456789abcdef01',
  message: 'feat(web): add a thing\n\nLonger body',
  authorName: 'Jane Doe',
  authoredAt: RELEASE_AT,
  ...overrides,
});

export const mockReleaseCandidate = (
  overrides: Partial<TReleaseCandidate> = {},
): TReleaseCandidate => ({
  headSha: '1234567abcdef1234567abcdef1234567abcdef',
  lastTag: MOCK_RELEASE_LAST_TAG,
  commits: [mockComparedCommit()],
  totalCommits: 1,
  isFileListTruncated: false,
  changes: {
    [RELEASE_CHANGE.RENDERING]: false,
    [RELEASE_CHANGE.DB_MIGRATION]: false,
    [RELEASE_CHANGE.SANITY_MIGRATION]: false,
    [RELEASE_CHANGE.ENV]: false,
  },
  migrations: {
    contentMigrations: 0,
    tenants: 0,
    dbMigrations: 0,
    isLowerBound: false,
  },
  contrastStatus: CONTRAST_STATUS.NONE,
  ...overrides,
});

export const MOCK_RELEASE_RUN_URL =
  'https://github.com/acme/blog/actions/runs/42';

export const mockReleaseRun = (
  overrides: Partial<TReleaseRun> = {},
): TReleaseRun => ({
  status: RELEASE_RUN_STATUS.SUCCEEDED,
  title: 'Release v1.4.0',
  url: MOCK_RELEASE_RUN_URL,
  createdAt: RELEASE_AT,
  isTenantMigrationFailed: false,
  ...overrides,
});
