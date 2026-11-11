import { getDb } from '@blog/db/client';
import {
  MEMBERSHIP_INVITE_OUTCOME,
  type TMembershipRole,
} from '@blog/db/constants';
import { inviteEmailColumns } from '@blog/db/queries/membership-invites/invite-email-columns';
import {
  membershipInvites,
  type TMembershipInvite,
} from '@blog/db/schema/membership-invites';
import { tenants } from '@blog/db/schema/tenants';
import { and, eq, sql } from 'drizzle-orm';

import { castTo, columnDefault } from './insert-select-columns';
import {
  membershipsCount,
  pendingInvitesCount,
  planSeats,
  releaseInvitePastSeatLimit,
} from './seat-limit';

export type TCreateMembershipInviteResult =
  | {
      outcome:
        | typeof MEMBERSHIP_INVITE_OUTCOME.CREATED
        | typeof MEMBERSHIP_INVITE_OUTCOME.ALREADY_PENDING
        | typeof MEMBERSHIP_INVITE_OUTCOME.ALREADY_CONSUMED;
      invite: TMembershipInvite;
    }
  | { outcome: typeof MEMBERSHIP_INVITE_OUTCOME.SEAT_LIMIT };

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
    outcome: existing.consumedAt
      ? MEMBERSHIP_INVITE_OUTCOME.ALREADY_CONSUMED
      : MEMBERSHIP_INVITE_OUTCOME.ALREADY_PENDING,
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
  const { emailEncrypted, emailIndex, emailExactIndex } =
    inviteEmailColumns(email);

  const existing = await findInvite(tenantId, emailExactIndex);

  if (existing) return existing;

  const [inserted] = await db
    .insert(membershipInvites)
    .select(
      db
        .select({
          id: columnDefault(membershipInvites.id),
          tenantId: sql<string>`${tenants.id}`.as(
            membershipInvites.tenantId.name,
          ),
          emailEncrypted: sql<string>`${emailEncrypted}`.as(
            membershipInvites.emailEncrypted.name,
          ),
          emailIndex: sql<string>`${emailIndex}`.as(
            membershipInvites.emailIndex.name,
          ),
          emailExactIndex: sql<string>`${emailExactIndex}`.as(
            membershipInvites.emailExactIndex.name,
          ),
          role: castTo(membershipInvites.role, sql`${role}`),
          createdAt: columnDefault(membershipInvites.createdAt),
          consumedAt: castTo(membershipInvites.consumedAt, sql`null`),
        })
        .from(tenants)
        .where(
          and(
            eq(tenants.id, tenantId),
            sql`${membershipsCount(tenantId)} + ${pendingInvitesCount(tenantId)} < ${planSeats()}`,
          ),
        ),
    )
    .onConflictDoNothing()
    .returning();

  if (inserted) {
    return (await releaseInvitePastSeatLimit(inserted.id))
      ? { outcome: MEMBERSHIP_INVITE_OUTCOME.SEAT_LIMIT }
      : { outcome: MEMBERSHIP_INVITE_OUTCOME.CREATED, invite: inserted };
  }

  const raced = await findInvite(tenantId, emailExactIndex);

  if (raced) return raced;

  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.id, tenantId));

  if (!tenant) {
    throw new Error(`createMembershipInvite: tenant "${tenantId}" not found.`);
  }

  return { outcome: MEMBERSHIP_INVITE_OUTCOME.SEAT_LIMIT };
}
