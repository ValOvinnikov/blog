import { pgTable } from 'drizzle-orm/pg-core';

import { fixedWindowCounterColumns } from './fixed-window-counter-columns';

export const magicLinkSendCounters = pgTable(
  'magic_link_send_counters',
  fixedWindowCounterColumns,
);
