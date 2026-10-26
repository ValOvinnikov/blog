'use server';

import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  type TMaybeUndefined,
} from '@blog/config';
import { queries } from '@blog/db';
import type { TPersonalDataReaderAccount } from '@blog/db/queries/personal-data/reader-account-personal-data';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import {
  runDataRequest,
  type TDataRequestFailure,
  type TDataRequestInput,
} from '@platform/server/data-requests/run-data-request';
import {
  countPersonalDataMatches,
  toDataRequestMatches,
  type TDataRequestMatch,
} from '@platform/server/data-requests/to-data-request-matches';

export type TLookUpPersonalDataResult =
  | {
      outcome: typeof ACTION_OUTCOME.SUCCESS;
      matches: TDataRequestMatch[];
      readerAccount: TMaybeUndefined<TPersonalDataReaderAccount>;
    }
  | TDataRequestFailure;

export const lookUpPersonalDataAction = async (
  input: TDataRequestInput,
): Promise<TLookUpPersonalDataResult> => {
  await requireSuperAdmin();

  const result = await runDataRequest(input, {
    run: queries.personalData.findPersonalData,
    action: AUDIT_ACTION.PERSONAL_DATA_LOOKED_UP,
    auditDetails: countPersonalDataMatches,
  });

  return result.ok
    ? {
        outcome: ACTION_OUTCOME.SUCCESS,
        matches: toDataRequestMatches(result.data),
        readerAccount: result.data.readerAccount,
      }
    : result.error;
};
