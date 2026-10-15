import { getDb } from '@blog/db/client';
import { leads, type TLead } from '@blog/db/schema/leads';
import { count, desc, eq } from 'drizzle-orm';

export type TListLeadsInput = {
  tenantId: string;
  page: number;
  pageSize: number;
};

export type TListLeadsResult = {
  leads: TLead[];
  total: number;
};

export async function listLeads({
  tenantId,
  page,
  pageSize,
}: TListLeadsInput): Promise<TListLeadsResult> {
  const db = getDb();
  const byTenant = eq(leads.tenantId, tenantId);

  const [rows, [totalRow]] = await Promise.all([
    db
      .select()
      .from(leads)
      .where(byTenant)
      .orderBy(desc(leads.createdAt), desc(leads.id))
      .limit(pageSize)
      .offset((Math.max(page, 1) - 1) * pageSize),
    db.select({ total: count() }).from(leads).where(byTenant),
  ]);

  return { leads: rows, total: totalRow?.total ?? 0 };
}
