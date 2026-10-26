'use server';

import { ACTION_OUTCOME, AUDIT_ACTION } from '@blog/config';
import { queries } from '@blog/db';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import {
  runDataRequest,
  type TDataRequestFailure,
  type TDataRequestInput,
} from '@platform/server/data-requests/run-data-request';

export type TErasePersonalDataInput = TDataRequestInput & {
  includesReaderAccount: boolean;
};

export type TErasePersonalDataResult =
  | {
      outcome: typeof ACTION_OUTCOME.SUCCESS;
      erasedCount: number;
      isReaderAccountRefused: boolean;
    }
  | TDataRequestFailure;

export const erasePersonalDataAction = async ({
  includesReaderAccount,
  ...input
}: TErasePersonalDataInput): Promise<TErasePersonalDataResult> => {
  await requireSuperAdmin();

  const result = await runDataRequest(input, {
    run: (email) =>
      queries.personalData.erasePersonalData(email, {
        includesReaderAccount: includesReaderAccount === true,
      }),
    action: AUDIT_ACTION.PERSONAL_DATA_ERASED,
    auditDetails: ({ erased }) => erased,
  });
  if (!result.ok) return result.error;

  const { erased, isReaderAccountRefused } = result.data;
  return {
    outcome: ACTION_OUTCOME.SUCCESS,
    erasedCount: Object.values(erased).reduce((sum, count) => sum + count, 0),
    isReaderAccountRefused,
  };
};
