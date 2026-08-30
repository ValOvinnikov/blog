import { getDb } from '@blog/db/client';
import type { TMembershipRole } from '@blog/db/constants';
import {
  membershipInvites,
  type TMembershipInvite,
} from '@blog/db/schema/membership-invites';
import { normalizeEmail } from '@blog/db/utils/normalize-email/normalize-email';
import { and, eq } from 'drizzle-orm';

export type TCreateMembershipInviteResult =
  | { outcome: 'created'; invite: TMembershipInvite }
  | { outcome: 'already-pending'; invite: TMembershipInvite }
  | { outcome: 'already-consumed'; invite: TMembershipInvite };

// Idempotent on the (tenantId, email) pair (the table's unique constraint)
// rather than throwing on a re-invite — the provisioning wizard's owner
// step can be re-run against the same email if the first invite email was
// lost. An existing row's `role` is not updated by a duplicate call;
// escalating an existing invite's role is a distinct, deliberate action
// this function doesn't perform.
export async function createMembershipInvite(
  tenantId: string,
  email: string,
  role: TMembershipRole,
): Promise<TCreateMembershipInviteResult> {
  const db = getDb();
  const normalizedEmail = normalizeEmail(email);

  const [inserted] = await db
    .insert(membershipInvites)
    .values({ tenantId, email: normalizedEmail, role })
    .onConflictDoNothing()
    .returning();

  if (inserted) {
    return { outcome: 'created', invite: inserted };
  }

  const [existing] = await db
    .select()
    .from(membershipInvites)
    .where(
      and(
        eq(membershipInvites.tenantId, tenantId),
        eq(membershipInvites.email, normalizedEmail),
      ),
    );

  if (!existing) {
    throw new Error(
      `createMembershipInvite: expected an existing row for tenant "${tenantId}" / email "${normalizedEmail}" after a no-op insert.`,
    );
  }

  return {
    outcome: existing.consumedAt ? 'already-consumed' : 'already-pending',
    invite: existing,
  };
}
