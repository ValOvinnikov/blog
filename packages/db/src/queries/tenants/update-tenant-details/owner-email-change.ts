import type { TMaybeUndefined, TOutcome } from '@blog/config';
import { getDb } from '@blog/db/client';
import {
  MEMBERSHIP_ROLE,
  TENANT_DETAILS_UPDATE_OUTCOME,
} from '@blog/db/constants';
import { inviteEmailColumns } from '@blog/db/queries/membership-invites/invite-email-columns';
import { getTenantOwnerMembership } from '@blog/db/queries/memberships';
import { users, verificationTokens } from '@blog/db/schema/auth';
import { membershipInvites } from '@blog/db/schema/membership-invites';
import { memberships } from '@blog/db/schema/memberships';
import { requireEmailIndex } from '@blog/db/utils/personal-data/personal-data';
import { userHasSignedIn } from '@blog/db/utils/user-has-signed-in/user-has-signed-in';
import { accountEmailIndex } from '@blog/utils/encryption';
import { normalizeEmail } from '@blog/utils/normalize-email-identity';
import { toOutcome } from '@blog/utils/to-outcome';
import { and, eq, isNull, ne } from 'drizzle-orm';

const OUTCOME = TENANT_DETAILS_UPDATE_OUTCOME;

type TOwnerGrant =
  { inviteId: string } | { membershipId: string; hasSignedIn: boolean };

export type TOwnerEmailChange = {
  tenantId: string;
  previousEmail: string;
  email: string;
  grant: TOwnerGrant;
};

export type TOwnerEmailRefusal =
  | TOutcome<typeof OUTCOME.OWNER_ALREADY_JOINED>
  | TOutcome<typeof OUTCOME.OWNER_EMAIL_TAKEN>;

async function findOwnerGrant(tenantId: string): Promise<TOwnerGrant> {
  const db = getDb();

  const [membership] = await db
    .select({ id: memberships.id, hasSignedIn: userHasSignedIn() })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(
      and(
        eq(memberships.tenantId, tenantId),
        eq(memberships.role, MEMBERSHIP_ROLE.OWNER),
      ),
    );
  if (membership) {
    return { membershipId: membership.id, hasSignedIn: membership.hasSignedIn };
  }

  const [pendingInvite] = await db
    .select({ id: membershipInvites.id })
    .from(membershipInvites)
    .where(
      and(
        eq(membershipInvites.tenantId, tenantId),
        eq(membershipInvites.role, MEMBERSHIP_ROLE.OWNER),
        isNull(membershipInvites.consumedAt),
      ),
    );
  if (pendingInvite) return { inviteId: pendingInvite.id };

  throw new Error(
    `updateTenantDetails: no owner membership or pending owner invite found for tenant "${tenantId}".`,
  );
}

export async function findOwnerEmailChange(
  tenantId: string,
  ownerEmail: string,
): Promise<TMaybeUndefined<TOwnerEmailChange> | TOwnerEmailRefusal> {
  const email = normalizeEmail(ownerEmail);
  const owner = await getTenantOwnerMembership(tenantId);
  const previousEmail = owner && normalizeEmail(owner.email);

  if (previousEmail === email) return undefined;

  const grant = await findOwnerGrant(tenantId);
  if ('hasSignedIn' in grant && grant.hasSignedIn) {
    return toOutcome(OUTCOME.OWNER_ALREADY_JOINED);
  }
  if (!previousEmail) {
    throw new Error(
      `updateTenantDetails: no owner email found for tenant "${tenantId}".`,
    );
  }

  const [emailConflict] = await getDb()
    .select({ id: membershipInvites.id })
    .from(membershipInvites)
    .where(
      and(
        eq(membershipInvites.tenantId, tenantId),
        eq(
          membershipInvites.emailExactIndex,
          requireEmailIndex(email, accountEmailIndex),
        ),
        'inviteId' in grant
          ? ne(membershipInvites.id, grant.inviteId)
          : undefined,
      ),
    );
  if (emailConflict) return toOutcome(OUTCOME.OWNER_EMAIL_TAKEN);

  return { tenantId, previousEmail, email, grant };
}

async function moveInvite(inviteId: string, email: string): Promise<void> {
  const [inviteRow] = await getDb()
    .update(membershipInvites)
    .set(inviteEmailColumns(email))
    .where(eq(membershipInvites.id, inviteId))
    .returning();

  if (!inviteRow) {
    throw new Error(
      `updateTenantDetails: owner invite "${inviteId}" update returned no row.`,
    );
  }
}

async function replaceMembershipWithInvite(
  tenantId: string,
  membershipId: string,
  email: string,
): Promise<void> {
  const db = getDb();

  const [invite] = await db
    .insert(membershipInvites)
    .values({
      tenantId,
      ...inviteEmailColumns(email),
      role: MEMBERSHIP_ROLE.OWNER,
    })
    .returning({ id: membershipInvites.id });

  if (!invite) {
    throw new Error(
      `updateTenantDetails: owner invite insert for tenant "${tenantId}" returned no row.`,
    );
  }

  try {
    await db.delete(memberships).where(eq(memberships.id, membershipId));
  } catch (error) {
    await db
      .delete(membershipInvites)
      .where(eq(membershipInvites.id, invite.id));
    throw error;
  }
}

export async function applyOwnerEmailChange({
  tenantId,
  previousEmail,
  email,
  grant,
}: TOwnerEmailChange): Promise<void> {
  await getDb()
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, previousEmail));

  if ('inviteId' in grant) {
    await moveInvite(grant.inviteId, email);
    return;
  }

  await replaceMembershipWithInvite(tenantId, grant.membershipId, email);
}
