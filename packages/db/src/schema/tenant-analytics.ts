import type { TAnalyticsProvider } from '@blog/config/constants';
import { pgTable, text, uuid } from 'drizzle-orm/pg-core';

import { timestampColumns } from './columns';
import { tenants } from './tenants';

export const tenantAnalytics = pgTable('tenant_analytics', {
  tenantId: uuid('tenant_id')
    .primaryKey()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  provider: text('provider').$type<TAnalyticsProvider>().notNull(),
  analyticsId: text('analytics_id').notNull(),
  ...timestampColumns,
});
