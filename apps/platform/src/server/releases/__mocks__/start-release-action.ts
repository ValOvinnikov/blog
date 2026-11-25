import type {
  TStartReleaseInput,
  TStartReleaseResult,
} from '@platform/server/releases/start-release-action';

export const startReleaseAction =
  vi.fn<(input: TStartReleaseInput) => Promise<TStartReleaseResult>>();
