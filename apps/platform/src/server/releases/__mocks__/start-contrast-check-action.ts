import type { TStartContrastCheckResult } from '@platform/server/releases/start-contrast-check-action';

export const startContrastCheckAction =
  vi.fn<() => Promise<TStartContrastCheckResult>>();
