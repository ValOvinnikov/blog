import type { TMaybeUndefined } from '@blog/config';
import { getDb } from '@blog/db/client';
import { LEADS_PAGE_SIZE } from '@blog/db/constants/lead';
import { leads, type TLead } from '@blog/db/schema/leads';
import { requireDecryptedPersonalValue } from '@blog/db/utils/personal-data/personal-data';
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

const LEAD_OWNER = 'Lead';

export async function listLeadsByCursor({
  tenantId,
  after,
}: TListLeadsByCursorInput): Promise<TListLeadsByCursorResult> {
  const db = getDb();

  const rows = await db
    .select({
      lead: {
        id: leads.id,
        nameEncrypted: leads.nameEncrypted,
        emailEncrypted: leads.emailEncrypted,
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
        lead: { nameEncrypted, emailEncrypted, messageEncrypted, ...lead },
      }) => ({
        ...lead,
        name: requireDecryptedPersonalValue(nameEncrypted, LEAD_OWNER),
        email: requireDecryptedPersonalValue(emailEncrypted, LEAD_OWNER),
        message: requireDecryptedPersonalValue(messageEncrypted, LEAD_OWNER),
      }),
    ),
    nextCursor:
      rows.length > LEADS_PAGE_SIZE && last
        ? { createdAt: last.cursorCreatedAt, id: last.lead.id }
        : undefined,
  };
}
