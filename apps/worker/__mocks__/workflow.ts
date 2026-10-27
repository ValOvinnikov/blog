const { FatalError, RetryableError } =
  await vi.importActual<typeof import('workflow')>('workflow');

export { FatalError, RetryableError };
export const getStepMetadata = vi.fn();
export const getWorkflowMetadata = vi.fn();
export const createHook = vi.fn();
export const sleep = vi.fn();
