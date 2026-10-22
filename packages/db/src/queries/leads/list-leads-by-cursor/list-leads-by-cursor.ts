import type { TMaybeUndefined } from '@blog/config';
import { getDb } from '@blog/db/client';
import { LEADS_PAGE_SIZE } from '@blog/db/constants/lead';
import { leads, type TLead } from '@blog/db/schema/leads';
import { and, desc, eq, sql } from 'drizzle-orm';

export type TLeadsCursor = {
  createdAt: string;
  id: string;
};

export type TListLeadsByCursorInput = {
  tenantId: string;
  after?: TLeadsCursor;
};

export type TListLeadsByCursorResult = {
  leads: TLead[];
  nextCursor: TMaybeUndefined<TLeadsCursor>;
};

export async function listLeadsByCursor({
  tenantId,
  after,
}: TListLeadsByCursorInput): Promise<TListLeadsByCursorResult> {
  const db = getDb();

  const rows = await db
    .select({
      lead: leads,
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
    leads: page.map(({ lead }) => lead),
    nextCursor:
      rows.length > LEADS_PAGE_SIZE && last
        ? { createdAt: last.cursorCreatedAt, id: last.lead.id }
        : undefined,
  };
}
