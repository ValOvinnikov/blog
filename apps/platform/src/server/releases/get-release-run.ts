import type { TMaybeUndefined } from '@blog/config';
import { okResult } from '@blog/utils';
import {
  RELEASE_RUN_STATUS,
  RELEASE_WORKFLOW_FILE,
  TENANT_MIGRATION_JOB_NAME,
  type TReleaseRunStatus,
} from '@platform/constants/release';
import {
  getLatestWorkflowRun,
  type TWorkflowRun,
} from '@platform/server/github/get-latest-workflow-run';
import { listFailedJobNames } from '@platform/server/github/list-failed-job-names';

import { toReleaseFailure, type TReleaseResult } from './release-result';

export type TReleaseRun = {
  status: TReleaseRunStatus;
  title: string;
  url: string;
  createdAt: string;
  isTenantMigrationFailed: boolean;
};

const toReleaseRunStatus = ({
  status,
  conclusion,
}: TWorkflowRun): TReleaseRunStatus => {
  if (status === 'completed') {
    return conclusion === 'success'
      ? RELEASE_RUN_STATUS.SUCCEEDED
      : RELEASE_RUN_STATUS.FAILED;
  }
  return status === 'in_progress'
    ? RELEASE_RUN_STATUS.RUNNING
    : RELEASE_RUN_STATUS.DISPATCHED;
};

/** The newest `release.yml` run, or `undefined` when there has been none. Never throws. */
export const getReleaseRun = async (): Promise<
  TReleaseResult<TMaybeUndefined<TReleaseRun>>
> => {
  const latest = await getLatestWorkflowRun(RELEASE_WORKFLOW_FILE);
  if (!latest.ok) return toReleaseFailure(latest.error);
  if (!latest.data) return okResult(undefined);

  const { id, htmlUrl, title, createdAt } = latest.data;
  const status = toReleaseRunStatus(latest.data);

  let isTenantMigrationFailed = false;
  if (status === RELEASE_RUN_STATUS.FAILED) {
    const failedJobs = await listFailedJobNames(id);
    if (!failedJobs.ok) return toReleaseFailure(failedJobs.error);
    isTenantMigrationFailed = failedJobs.data.some((name) =>
      name.includes(TENANT_MIGRATION_JOB_NAME),
    );
  }

  return okResult({
    status,
    title,
    url: htmlUrl,
    createdAt,
    isTenantMigrationFailed,
  });
};
