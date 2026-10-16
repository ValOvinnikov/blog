import type { TContrastCheckOutcome } from '@blog/config/constants';

export type TContrastResultBody = {
  sha: string;
  outcome: TContrastCheckOutcome;
  failureCount: number;
  runUrl: string;
  tag?: string;
};
