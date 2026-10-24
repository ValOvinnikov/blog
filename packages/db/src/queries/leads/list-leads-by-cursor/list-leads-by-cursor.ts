import type { TMaybeUndefined } from '@blog/config';
import { getDb } from '@blog/db/client';
import { PERSONAL_DATA_OWNER } from '@blog/db/constants';
import { LEADS_PAGE_SIZE } from '@blog/db/constants/lead';
import { leads, type TLead } from '@blog/db/schema/leads';
import {
  readPersonalValue,
  reportPlainPersonalRead,
} from '@blog/db/utils/personal-data/personal-data';
import { and, desc, eq, sql } from 'drizzle-orm';

export type TLeadsCursor = {
  createdAt: string;
  id: string;
};

export type TListLeadsByCursorInput = {
  tenantId: string;
  after?: TLeadsCursor;
};

export type TListedLead = Pick<
  TLead,
  | 'id'
  | 'name'
  | 'email'
  | 'message'
  | 'sourcePath'
  | 'sourceDocumentId'
  | 'sourceLocale'
  | 'readAt'
  | 'createdAt'
>;

export type TListLeadsByCursorResult = {
  leads: TListedLead[];
  nextCursor: TMaybeUndefined<TLeadsCursor>;
};

export async function listLeadsByCursor({
  tenantId,
  after,
}: TListLeadsByCursorInput): Promise<TListLeadsByCursorResult> {
  const db = getDb();

  const rows = await db
    .select({
      lead: {
        id: leads.id,
        name: leads.name,
        nameEncrypted: leads.nameEncrypted,
        email: leads.email,
        emailEncrypted: leads.emailEncrypted,
        message: leads.message,
        messageEncrypted: leads.messageEncrypted,
        sourcePath: leads.sourcePath,
        sourceDocumentId: leads.sourceDocumentId,
        sourceLocale: leads.sourceLocale,
        readAt: leads.readAt,
        createdAt: leads.createdAt,
      },
      // A JS Date drops Postgres's microseconds, so the cursor keeps the exact text.
      cursorCreatedAt: sql<string>`${leads.createdAt}::text`,
    })
    .from(leads)
    .where(
      and(
        eq(leads.tenantId, tenantId),
        after &&
          sql`(${leads.createdAt}, ${leads.id}) < (${after.createdAt}::timestamptz, ${after.id}::uuid)`,
      ),
    )
    .orderBy(desc(leads.createdAt), desc(leads.id))
    .limit(LEADS_PAGE_SIZE + 1);

  const page = rows.slice(0, LEADS_PAGE_SIZE);
  const last = page.at(-1);

  return {
    leads: page.map(
      ({
        lead: {
          name,
          nameEncrypted,
          email,
          emailEncrypted,
          message,
          messageEncrypted,
          ...lead
        },
      }) => {
        reportPlainPersonalRead(PERSONAL_DATA_OWNER.LEAD, emailEncrypted);
        return {
          ...lead,
          name: readPersonalValue(nameEncrypted, name),
          email: readPersonalValue(emailEncrypted, email),
          message: readPersonalValue(messageEncrypted, message),
        };
      },
    ),
    nextCursor:
      rows.length > LEADS_PAGE_SIZE && last
        ? { createdAt: last.cursorCreatedAt, id: last.lead.id }
        : undefined,
  };
}
