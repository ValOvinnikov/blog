import { pgTable } from 'drizzle-orm/pg-core';

import { fixedWindowCounterColumns } from './fixed-window-counter-columns';

export const testEmailSendCounters = pgTable(
  'test_email_send_counters',
  fixedWindowCounterColumns,
);
