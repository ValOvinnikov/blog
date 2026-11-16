import type { TContrastCheckOutcome } from '@shinefold/config/constants';

export type TContrastResultBody = {
  sha: string;
  outcome: TContrastCheckOutcome;
  failureCount: number;
  runUrl: string;
  tag?: string;
  supersededBy?: string;
};
