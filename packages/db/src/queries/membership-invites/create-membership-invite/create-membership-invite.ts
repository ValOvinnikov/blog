import { getDb } from '@blog/db/client';
import { PLAN_ENTITLEMENTS, type TMembershipRole } from '@blog/db/constants';
import { inviteEmailColumns } from '@blog/db/queries/membership-invites/invite-email-columns';
import {
  CREATED_AT_COLUMN,
  EMAIL_ENCRYPTED_COLUMN,
  EMAIL_EXACT_INDEX_COLUMN,
  EMAIL_INDEX_COLUMN,
} from '@blog/db/schema/columns';
import {
  membershipInvites,
  type TMembershipInvite,
} from '@blog/db/schema/membership-invites';
import { memberships } from '@blog/db/schema/memberships';
import { tenants } from '@blog/db/schema/tenants';
import { and, eq, isNull, sql } from 'drizzle-orm';

export type TCreateMembershipInviteResult =
  | { outcome: 'created'; invite: TMembershipInvite }
  | { outcome: 'already-pending'; invite: TMembershipInvite }
  | { outcome: 'already-consumed'; invite: TMembershipInvite }
  | { outcome: 'seat-limit' };

async function findInvite(
  tenantId: string,
  emailExactIndex: string,
): Promise<TCreateMembershipInviteResult | undefined> {
  const [existing] = await getDb()
    .select()
    .from(membershipInvites)
    .where(
      and(
        eq(membershipInvites.tenantId, tenantId),
        eq(membershipInvites.emailExactIndex, emailExactIndex),
      ),
    );

  if (!existing) return undefined;

  return {
    outcome: existing.consumedAt ? 'already-consumed' : 'already-pending',
    invite: existing,
  };
}

// A re-invite of an address the tenant already invited never takes a seat,
// so it reports the existing row even at the limit; an existing row's `role`
// is never changed by a duplicate call.
export async function createMembershipInvite(
  tenantId: string,
  email: string,
  role: TMembershipRole,
): Promise<TCreateMembershipInviteResult> {
  const db = getDb();
  const emailColumns = inviteEmailColumns(email);
  const { emailExactIndex } = emailColumns;

  const existing = await findInvite(tenantId, emailExactIndex);

  if (existing) return existing;

  const [tenant] = await db
    .select({ plan: tenants.plan })
    .from(tenants)
    .where(eq(tenants.id, tenantId));

  if (!tenant) {
    throw new Error(`createMembershipInvite: tenant "${tenantId}" not found.`);
  }

  const seatsTaken = sql<number>`(
    (select count(*) from ${memberships} where ${eq(memberships.tenantId, tenantId)})
    + (select count(*) from ${membershipInvites}
       where ${and(eq(membershipInvites.tenantId, tenantId), isNull(membershipInvites.consumedAt))})
  )`;

  const [inserted] = await db
    .insert(membershipInvites)
    .select(
      db
        .select({
          id: sql<string>`gen_random_uuid()`.as('id'),
          tenantId: sql<string>`${tenantId}::uuid`.as('tenant_id'),
          emailEncrypted: sql<string>`${emailColumns.emailEncrypted}`.as(
            EMAIL_ENCRYPTED_COLUMN,
          ),
          emailIndex: sql<string>`${emailColumns.emailIndex}`.as(
            EMAIL_INDEX_COLUMN,
          ),
          emailExactIndex: sql<string>`${emailExactIndex}`.as(
            EMAIL_EXACT_INDEX_COLUMN,
          ),
          role: sql<TMembershipRole>`${role}::membership_role`.as('role'),
          createdAt: sql<Date>`now()`.as(CREATED_AT_COLUMN),
          consumedAt: sql<null>`null::timestamp`.as('consumed_at'),
        })
        .from(tenants)
        .where(
          and(
            eq(tenants.id, tenantId),
            sql`${seatsTaken} < ${PLAN_ENTITLEMENTS[tenant.plan].seats}`,
          ),
        ),
    )
    .onConflictDoNothing()
    .returning();

  if (inserted) {
    return { outcome: 'created', invite: inserted };
  }

  return (
    (await findInvite(tenantId, emailExactIndex)) ?? { outcome: 'seat-limit' }
  );
}
