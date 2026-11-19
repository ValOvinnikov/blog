import { tenants } from '@shinefold/db/schema/tenants';
import { isNull } from 'drizzle-orm';

export const isNotDeprovisioned = isNull(tenants.deprovisionedAt);
