import { queries } from '@blog/db';
import { okResult } from '@blog/utils';
import type { TChangedFile } from '@platform/server/github/compare-commits';
import { getDbMigrationJournal } from '@platform/server/github/get-db-migration-journal';

import {
  countAddedContentMigrations,
  countPendingDbMigrations,
  listAddedDbMigrationTags,
} from './added-migrations';
import {
  readDb,
  toReleaseFailure,
  type TReleaseResult,
} from './release-result';

export type TReleaseMigrationSummary = {
  contentMigrations: number;
  tenants: number;
  dbMigrations: number;
  isLowerBound: boolean;
};

type TSummariseReleaseMigrationsInput = {
  files: TChangedFile[];
  isFileListTruncated: boolean;
  headSha: string;
};

// Content migrations also run against the console project, which is no tenant row.
const CONSOLE_PROJECT_COUNT = 1;

const countMigrationTargets = async (): Promise<TReleaseResult<number>> => {
  const tenants = await readDb(() => queries.tenants.listActiveTenants());
  if (!tenants.ok) return tenants;

  return okResult(tenants.data.length + CONSOLE_PROJECT_COUNT);
};

const countDbMigrations = async (
  files: TChangedFile[],
  headSha: string,
): Promise<TReleaseResult<number>> => {
  const addedTags = listAddedDbMigrationTags(files);
  if (addedTags.length === 0) return okResult(0);

  const [journal, applied] = await Promise.all([
    getDbMigrationJournal(headSha),
    readDb(() => queries.migrations.listAppliedMigrationTimestamps()),
  ]);
  if (!journal.ok) return toReleaseFailure(journal.error);
  if (!applied.ok) return applied;

  return okResult(
    countPendingDbMigrations(addedTags, journal.data, applied.data),
  );
};

/** A tenant whose own ledger lags further behind is not read, so `contentMigrations` is a lower bound for it. */
export const summariseReleaseMigrations = async ({
  files,
  isFileListTruncated,
  headSha,
}: TSummariseReleaseMigrationsInput): Promise<
  TReleaseResult<TReleaseMigrationSummary>
> => {
  const contentMigrations = countAddedContentMigrations(files);

  const [targets, dbMigrations] = await Promise.all([
    contentMigrations > 0
      ? countMigrationTargets()
      : Promise.resolve<TReleaseResult<number>>(okResult(0)),
    countDbMigrations(files, headSha),
  ]);
  if (!targets.ok) return targets;
  if (!dbMigrations.ok) return dbMigrations;

  return okResult({
    contentMigrations,
    tenants: targets.data,
    dbMigrations: dbMigrations.data,
    isLowerBound: isFileListTruncated,
  });
};
