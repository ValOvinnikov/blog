import { accounts, users } from '@blog/db/schema/auth';
import { sql, type SQL } from 'drizzle-orm';

// A magic-link sign-in sets `emailVerified`; an OAuth sign-in leaves it null but links an account.
export function userHasSignedIn(): SQL<boolean> {
  return sql<boolean>`(${users.emailVerified} is not null or exists (select 1 from ${accounts} where ${accounts.userId} = ${users.id}))`;
}
