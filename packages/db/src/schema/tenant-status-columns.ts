import { TENANT_STATUS } from '@blog/db/constants';
import { pgEnum } from 'drizzle-orm/pg-core';

export const tenantStatusEnum = pgEnum('tenant_status', TENANT_STATUS);

export const tenantStatusColumns = {
  status: tenantStatusEnum('status').notNull(),
  statusBeforeHold: tenantStatusEnum('status_before_hold'),
};
