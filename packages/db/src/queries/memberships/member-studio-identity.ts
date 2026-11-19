import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config/types';
import { users } from '@shinefold/db/schema/auth';
import { memberships } from '@shinefold/db/schema/memberships';
import { decryptOptionalPersonalValue } from '@shinefold/db/utils/personal-data/personal-data';

export type TMemberStudioIdentity = {
  email: TMaybeUndefined<string>;
  sanityUserId: TMaybeUndefined<string>;
};

export const memberStudioIdentityColumns = {
  emailEncrypted: users.emailEncrypted,
  sanityUserId: memberships.sanityUserId,
};

export function toMemberStudioIdentity({
  emailEncrypted,
  sanityUserId,
}: {
  emailEncrypted: TMaybeNull<string>;
  sanityUserId: TMaybeNull<string>;
}): TMemberStudioIdentity {
  return {
    email: decryptOptionalPersonalValue(emailEncrypted) ?? undefined,
    sanityUserId: sanityUserId ?? undefined,
  };
}
