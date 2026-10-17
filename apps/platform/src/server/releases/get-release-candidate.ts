import { RELEASE_CHANGE } from '@blog/config';
import type { TContrastStatus } from '@platform/constants/release';
import {
  compareCommits,
  type TComparedCommit,
} from '@platform/server/github/compare-commits';
import { getBranchHeadSha } from '@platform/server/github/get-branch-head-sha';
import { getLatestReleaseTag } from '@platform/server/github/get-latest-release-tag';

import {
  classifyReleaseChanges,
  type TReleaseChanges,
} from './classify-release-changes';
import { toReleaseFailure, type TReleaseResult } from './release-result';
import { resolveContrastStatus } from './resolve-contrast-status';
import {
  summariseReleaseMigrations,
  type TReleaseMigrationSummary,
} from './summarise-release-migrations';

export type TReleaseCandidate = {
  headSha: string;
  lastTag: string;
  commits: TComparedCommit[];
  totalCommits: number;
  changes: TReleaseChanges;
  migrations: TReleaseMigrationSummary;
  contrastStatus: TContrastStatus;
};

/** `main`'s HEAD measured against the latest `vX.Y.Z` tag. Never throws. */
export const getReleaseCandidate = async (): Promise<
  TReleaseResult<TReleaseCandidate>
> => {
  const [lastTag, headSha] = await Promise.all([
    getLatestReleaseTag(),
    getBranchHeadSha(),
  ]);
  if (!lastTag.ok) return toReleaseFailure(lastTag.reason);
  if (!headSha.ok) return toReleaseFailure(headSha.reason);
  if (!lastTag.data) return { ok: false, reason: 'noReleaseTag' };

  const comparison = await compareCommits(lastTag.data, headSha.data);
  if (!comparison.ok) return toReleaseFailure(comparison.reason);

  const { commits, totalCommits, files, isFileListTruncated } = comparison.data;
  const changes = classifyReleaseChanges(files, isFileListTruncated);

  const [migrations, contrastStatus] = await Promise.all([
    summariseReleaseMigrations(files, headSha.data),
    resolveContrastStatus({
      headSha: headSha.data,
      renderingChangedSinceTag: changes[RELEASE_CHANGE.RENDERING],
    }),
  ]);
  if (!migrations.ok) return migrations;
  if (!contrastStatus.ok) return contrastStatus;

  return {
    ok: true,
    data: {
      headSha: headSha.data,
      lastTag: lastTag.data,
      commits,
      totalCommits,
      changes,
      migrations: migrations.data,
      contrastStatus: contrastStatus.data,
    },
  };
};
