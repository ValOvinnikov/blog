import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import {
  isAuditActor,
  isBlockedAddress,
  toPersonalDataMatch,
} from '@blog/db/queries/personal-data/personal-data-match';
import { auditEvents } from '@blog/db/schema/audit-events';
import { blockedSignupIdentities } from '@blog/db/schema/blocked-signup-identities';
import { leads } from '@blog/db/schema/leads';
import { membershipInvites } from '@blog/db/schema/membership-invites';
import { subscribers } from '@blog/db/schema/subscribers';
import type { TResult } from '@blog/utils';
import { eq } from 'drizzle-orm';

export type TPersonalDataCounts = {
  subscribers: number;
  leads: number;
  membershipInvites: number;
  blockedSignupIdentities: number;
  auditEvents: number;
};

export type TPersonalDataErasure = {
  emailIndex: string;
  erased: TPersonalDataCounts;
};

// Runs without a transaction (`neon-http`); every statement is idempotent, so a retry finishes the rest.
export async function erasePersonalData(
  email: string,
): Promise<TResult<TPersonalDataErasure, TErrorCode>> {
  const match = toPersonalDataMatch(email);
  if (!match) return { ok: false, error: ERROR_CODE.DB_INVALID_EMAIL };

  const { emailIndex, mailbox } = match;
  const db = getDb();

  const [
    erasedSubscribers,
    erasedLeads,
    erasedInvites,
    erasedBlocks,
    anonymisedAuditEvents,
  ] = await Promise.all([
    db
      .delete(subscribers)
      .where(eq(subscribers.emailIndex, emailIndex))
      .returning({ id: subscribers.id }),
    db
      .delete(leads)
      .where(eq(leads.emailIndex, emailIndex))
      .returning({ id: leads.id }),
    db
      .delete(membershipInvites)
      .where(eq(membershipInvites.emailIndex, emailIndex))
      .returning({ id: membershipInvites.id }),
    db
      .delete(blockedSignupIdentities)
      .where(isBlockedAddress(emailIndex))
      .returning({ id: blockedSignupIdentities.id }),
    db
      .update(auditEvents)
      .set({ actorEmail: null })
      .where(isAuditActor(mailbox))
      .returning({ id: auditEvents.id }),
  ]);

  return {
    ok: true,
    data: {
      emailIndex,
      erased: {
        subscribers: erasedSubscribers.length,
        leads: erasedLeads.length,
        membershipInvites: erasedInvites.length,
        blockedSignupIdentities: erasedBlocks.length,
        auditEvents: anonymisedAuditEvents.length,
      },
    },
  };
}
