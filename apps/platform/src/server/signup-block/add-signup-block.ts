import 'server-only';

import { recordSignupBlockAdded } from '@platform/server/signup-block/signup-block-audit';
import type { TErrorCode } from '@shinefold/config';
import { queries, type TBlockedIdentityKind } from '@shinefold/db';
import type { TAddBlockedIdentityOutcome } from '@shinefold/db/queries/blocked-signup-identities/add-blocked-identity';
import type { TAdmin } from '@shinefold/db/schema/admins';
import type { TResult } from '@shinefold/utils';

export type TAddSignupBlockInput = {
  kind: TBlockedIdentityKind;
  identity: string;
  reason: string;
  admin: Pick<TAdmin, 'id'>;
};

export const saveSignupBlock = async ({
  kind,
  identity,
  reason,
  admin,
}: TAddSignupBlockInput): Promise<
  TResult<TAddBlockedIdentityOutcome, TErrorCode>
> =>
  queries.blockedSignupIdentities.addBlockedIdentity({
    kind,
    identity,
    reason,
    createdByAdminId: admin.id,
  });

export const addSignupBlock = async (
  input: TAddSignupBlockInput,
): Promise<TResult<TAddBlockedIdentityOutcome, TErrorCode>> => {
  const result = await saveSignupBlock(input);
  if (result.ok && result.data.created) {
    await recordSignupBlockAdded(result.data.entry, input.reason);
  }

  return result;
};
