import 'server-only';

import type { TMaybeNull } from '@blog/config';
import {
  BLOCKED_IDENTITY_KIND,
  queries,
  type TBlockedIdentityKind,
} from '@blog/db';
import type { TBlockedIdentityListing } from '@blog/db/queries/blocked-signup-identities/list-blocked-identities';

const HASH_PREVIEW_LENGTH = 12;

export type TBlockedSignupEntry = {
  id: string;
  kind: TBlockedIdentityKind;
  displayValue: string;
  reason: string;
  createdAt: Date;
  addedBy: TMaybeNull<string>;
};

const toDisplayValue = ({ kind, value }: TBlockedIdentityListing): string =>
  kind === BLOCKED_IDENTITY_KIND.ADDRESS
    ? `${value.slice(0, HASH_PREVIEW_LENGTH)}…`
    : value;

export const loadBlockedSignupEntries = async (): Promise<
  TBlockedSignupEntry[]
> => {
  const result = await queries.blockedSignupIdentities.listBlockedIdentities();
  if (!result.ok) {
    throw new Error(`Could not list blocked sign-ups: ${result.error}`);
  }

  return result.data.map((entry) => ({
    id: entry.id,
    kind: entry.kind,
    displayValue: toDisplayValue(entry),
    reason: entry.reason,
    createdAt: entry.createdAt,
    addedBy: entry.addedByEmail,
  }));
};
