export type TWorkflowRunUrlInput = {
  serverUrl: string | undefined;
  repository: string | undefined;
  runId: string | undefined;
};

/**
 * Builds the absolute URL of the running GitHub Actions workflow run, or
 * `undefined` unless all three of its parts are present.
 */
export function workflowRunUrl(
  input: TWorkflowRunUrlInput,
): string | undefined {
  const { serverUrl, repository, runId } = input;
  if (!serverUrl || !repository || !runId) return undefined;

  return `${serverUrl}/${repository}/actions/runs/${runId}`;
}
