import { tenantStatusEnum } from './tenant-enums';

export const tenantStatusColumns = {
  status: tenantStatusEnum('status').notNull(),
  statusBeforeHold: tenantStatusEnum('status_before_hold'),
};
