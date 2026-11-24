export const ACCESS_RUN_LOG = {
  WORKFLOW_CALL_STARTED: 'access_run.workflow_call_started',
  WORKFLOW_CALL_DONE: 'access_run.workflow_call_done',
} as const;
export const ACCESS_RUN_CALL = {
  GET_HOOK_BY_TOKEN: 'GET_HOOK_BY_TOKEN',
  RUN_STATUS: 'RUN_STATUS',
  RUN_CREATED_AT: 'RUN_CREATED_AT',
  RUN_CANCEL: 'RUN_CANCEL',
  RESUME_HOOK: 'RESUME_HOOK',
  START_RUN: 'START_RUN',
} as const;
