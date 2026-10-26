import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { deleteAccount } from '@blog/db/queries/account/delete-account';
import { toPersonalEmailIndex } from '@blog/db/queries/personal-data/personal-data-match';
import { findUserByEmail } from '@blog/db/queries/users/find-user-by-email';
import { leads } from '@blog/db/schema/leads';
import { membershipInvites } from '@blog/db/schema/membership-invites';
import { subscribers } from '@blog/db/schema/subscribers';
import { errorResult, okResult, type TResult } from '@blog/utils';
import { eq } from 'drizzle-orm';

export type TPersonalDataCounts = {
  subscribers: number;
  leads: number;
  membershipInvites: number;
  readerAccounts: number;
};

export type TPersonalDataErasure = {
  emailIndex: string;
  erased: TPersonalDataCounts;
  isReaderAccountRefused: boolean;
};

export type TPersonalDataErasureScope = {
  includesReaderAccount: boolean;
};

async function eraseReaderAccount(
  email: string,
): Promise<TResult<number, TErrorCode>> {
  const user = await findUserByEmail(email);
  if (!user) return okResult(0);

  const result = await deleteAccount(user.id);
  return result.ok ? okResult(1) : result;
}

// Runs without a transaction (`neon-http`); every statement is idempotent, so a retry finishes the rest.
// Keeps a sign-up block: it holds only the address's hash and keeps the address out.
export async function erasePersonalData(
  email: string,
  { includesReaderAccount }: TPersonalDataErasureScope,
): Promise<TResult<TPersonalDataErasure, TErrorCode>> {
  const emailIndex = toPersonalEmailIndex(email);
  if (!emailIndex) return errorResult(ERROR_CODE.DB_INVALID_EMAIL);

  const db = getDb();

  const [erasedSubscribers, erasedLeads, erasedInvites, erasedAccounts] =
    await Promise.all([
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
      includesReaderAccount ? eraseReaderAccount(email.trim()) : okResult(0),
    ]);

  const isReaderAccountRefused =
    !erasedAccounts.ok &&
    erasedAccounts.error === ERROR_CODE.DB_HOLDS_PLATFORM_ROLE;
  if (!erasedAccounts.ok && !isReaderAccountRefused) return erasedAccounts;

  return okResult({
    emailIndex,
    erased: {
      subscribers: erasedSubscribers.length,
      leads: erasedLeads.length,
      membershipInvites: erasedInvites.length,
      readerAccounts: erasedAccounts.ok ? erasedAccounts.data : 0,
    },
    isReaderAccountRefused,
  });
}
