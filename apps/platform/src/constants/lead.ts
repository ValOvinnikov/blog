import type { TValueOf } from '@blog/config/utils';

export const LEAD_REFUSAL = {
  NOT_FOUND: 'NOT_FOUND',
} as const;

export type TLeadRefusal = TValueOf<typeof LEAD_REFUSAL>;

export const LEAD_LOG = {
  DELETE_FAILED: 'leads.delete_failed',
  LOAD_FAILED: 'leads.load_failed',
  READ_STATE_FAILED: 'leads.read_state_failed',
  PAGE_TITLE_SKIPPED: 'leads.page_title_skipped',
  PAGE_TITLE_FAILED: 'leads.page_title_failed',
  PAGE_TITLE_ERROR: 'leads.page_title_error',
} as const;
