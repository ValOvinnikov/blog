import { FINDING_STATUS, RELEASE_CHANGE } from '@blog/config';
import { queries } from '@blog/db';
import {
  CONTRAST_STATUS,
  type TContrastStatus,
} from '@platform/constants/release';
import { compareCommits } from '@platform/server/github/compare-commits';
import { isWorkflowRunActive } from '@platform/server/github/is-workflow-run-active';

import { classifyReleaseChanges } from './classify-release-changes';
import {
  readDb,
  toReleaseFailure,
  type TReleaseResult,
} from './release-result';

const CONTRAST_WORKFLOW_FILE = 'contrast.yml';

type TResolveContrastStatusInput = {
  headSha: string;
  renderingChangedSinceTag: boolean;
};

/** Due only when the candidate touches rendering and rendering changed since the last green run. */
export const resolveContrastStatus = async ({
  headSha,
  renderingChangedSinceTag,
}: TResolveContrastStatusInput): Promise<TReleaseResult<TContrastStatus>> => {
  const finding = await readDb(() =>
    queries.findings.getContrastFinding(headSha),
  );
  if (!finding.ok) return finding;
  if (finding.data) {
    const isGreen = finding.data.status === FINDING_STATUS.RESOLVED;
    return {
      ok: true,
      data: isGreen ? CONTRAST_STATUS.GREEN : CONTRAST_STATUS.FAILED,
    };
  }

  const active = await isWorkflowRunActive(CONTRAST_WORKFLOW_FILE, headSha);
  if (!active.ok) return toReleaseFailure(active.reason);
  if (active.data) return { ok: true, data: CONTRAST_STATUS.RUNNING };

  if (!renderingChangedSinceTag) {
    return { ok: true, data: CONTRAST_STATUS.NONE };
  }

  const lastGreenSha = await readDb(() =>
    queries.findings.getLatestPassingContrastSha(),
  );
  if (!lastGreenSha.ok) return lastGreenSha;
  if (!lastGreenSha.data) return { ok: true, data: CONTRAST_STATUS.DUE };

  const sinceGreen = await compareCommits(lastGreenSha.data, headSha);
  if (!sinceGreen.ok) return toReleaseFailure(sinceGreen.reason);

  const { files, isFileListTruncated } = sinceGreen.data;
  const changes = classifyReleaseChanges(files, isFileListTruncated);

  return {
    ok: true,
    data: changes[RELEASE_CHANGE.RENDERING]
      ? CONTRAST_STATUS.DUE
      : CONTRAST_STATUS.NONE,
  };
};
