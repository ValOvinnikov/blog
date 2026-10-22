import type { TMaybeNull } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { leads, type TLead } from '@blog/db/schema/leads';
import { decryptPersonalValue } from '@blog/db/utils/personal-data/personal-data';
import { count, desc, eq } from 'drizzle-orm';

export type TListLeadsInput = {
  tenantId: string;
  page: number;
  pageSize: number;
};

export type TListedLead = Pick<
  TLead,
  'id' | 'name' | 'email' | 'message' | 'sourcePath' | 'createdAt'
>;

export type TListLeadsResult = {
  leads: TListedLead[];
  total: number;
};

function decryptLeadValue(encrypted: TMaybeNull<string>): string {
  if (encrypted === null) throw new Error('Lead has no encrypted form.');
  return decryptPersonalValue(encrypted);
}

export async function listLeads({
  tenantId,
  page,
  pageSize,
}: TListLeadsInput): Promise<TListLeadsResult> {
  const db = getDb();
  const byTenant = eq(leads.tenantId, tenantId);

  const [rows, [totalRow]] = await Promise.all([
    db
      .select({
        id: leads.id,
        nameEncrypted: leads.nameEncrypted,
        emailEncrypted: leads.emailEncrypted,
        messageEncrypted: leads.messageEncrypted,
        sourcePath: leads.sourcePath,
        createdAt: leads.createdAt,
      })
      .from(leads)
      .where(byTenant)
      .orderBy(desc(leads.createdAt), desc(leads.id))
      .limit(pageSize)
      .offset((Math.max(page, 1) - 1) * pageSize),
    db.select({ total: count() }).from(leads).where(byTenant),
  ]);

  return {
    leads: rows.map(
      ({
        id,
        nameEncrypted,
        emailEncrypted,
        messageEncrypted,
        sourcePath,
        createdAt,
      }) => ({
        id,
        name: decryptLeadValue(nameEncrypted),
        email: decryptLeadValue(emailEncrypted),
        message: decryptLeadValue(messageEncrypted),
        sourcePath,
        createdAt,
      }),
    ),
    total: totalRow?.total ?? 0,
  };
}
