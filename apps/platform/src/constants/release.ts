import type { TValueOf } from '@blog/config/utils';

export const CONTRAST_STATUS = {
  GREEN: 'GREEN',
  FAILED: 'FAILED',
  RUNNING: 'RUNNING',
  NONE: 'NONE',
  DUE: 'DUE',
} as const;

export type TContrastStatus = TValueOf<typeof CONTRAST_STATUS>;

export const CONTRAST_WORKFLOW_FILE = 'contrast.yml';

export const GITHUB_COMPARE_FILE_LIMIT = 300;
