import { leads } from '@blog/db/schema/leads';
import { and, eq } from 'drizzle-orm';

export type TLeadKey = {
  tenantId: string;
  id: string;
};

export function byLeadKey({ tenantId, id }: TLeadKey) {
  return and(eq(leads.tenantId, tenantId), eq(leads.id, id));
}
