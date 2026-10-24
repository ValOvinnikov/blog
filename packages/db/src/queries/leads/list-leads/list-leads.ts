import { getDb } from '@blog/db/client';
import { PERSONAL_DATA_OWNER } from '@blog/db/constants';
import { leads, type TLead } from '@blog/db/schema/leads';
import {
  readPersonalValue,
  reportPlainPersonalRead,
} from '@blog/db/utils/personal-data/personal-data';
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
        name: leads.name,
        nameEncrypted: leads.nameEncrypted,
        email: leads.email,
        emailEncrypted: leads.emailEncrypted,
        message: leads.message,
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
        name,
        nameEncrypted,
        email,
        emailEncrypted,
        message,
        messageEncrypted,
        sourcePath,
        createdAt,
      }) => {
        reportPlainPersonalRead(PERSONAL_DATA_OWNER.LEAD, emailEncrypted);
        return {
          id,
          name: readPersonalValue(nameEncrypted, name),
          email: readPersonalValue(emailEncrypted, email),
          message: readPersonalValue(messageEncrypted, message),
          sourcePath,
          createdAt,
        };
      },
    ),
    total: totalRow?.total ?? 0,
  };
}
