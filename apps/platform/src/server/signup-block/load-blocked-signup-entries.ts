import 'server-only';

import { AUDIT_ACTION, AUDIT_TARGET_TYPE, type TMaybeNull } from '@blog/config';
import {
  BLOCKED_IDENTITY_KIND,
  queries,
  type TBlockedIdentityKind,
} from '@blog/db';
import type { TBlockedSignupIdentity } from '@blog/db/schema/blocked-signup-identities';

const HASH_PREVIEW_LENGTH = 12;

export type TBlockedSignupEntry = {
  id: string;
  kind: TBlockedIdentityKind;
  displayValue: string;
  reason: string;
  createdAt: Date;
  addedBy: TMaybeNull<string>;
};

const AUDIT_LOOKUP_LIMIT = 50;

const findAddedBy = async (id: string): Promise<TMaybeNull<string>> => {
  const events = await queries.auditEvents.listAuditEventsForTarget(
    AUDIT_TARGET_TYPE.BLOCKED_SIGNUP_IDENTITY,
    id,
    { limit: AUDIT_LOOKUP_LIMIT },
  );
  const firstAdd = events.findLast(
    ({ action }) => action === AUDIT_ACTION.SIGNUP_BLOCK_ADDED,
  );
  return firstAdd?.actorEmail ?? null;
};

const toDisplayValue = ({ kind, value }: TBlockedSignupIdentity): string =>
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

  return Promise.all(
    result.data.map(async (entry) => ({
      id: entry.id,
      kind: entry.kind,
      displayValue: toDisplayValue(entry),
      reason: entry.reason,
      createdAt: entry.createdAt,
      addedBy: await findAddedBy(entry.id),
    })),
  );
};
