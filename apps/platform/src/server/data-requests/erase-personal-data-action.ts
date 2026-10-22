'use server';

import { ACTION_OUTCOME, AUDIT_ACTION } from '@blog/config';
import { queries } from '@blog/db';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import {
  runDataRequest,
  type TDataRequestFailure,
  type TDataRequestInput,
} from '@platform/server/data-requests/run-data-request';

export type TErasePersonalDataResult =
  | { outcome: typeof ACTION_OUTCOME.SUCCESS; erasedCount: number }
  | TDataRequestFailure;

export const erasePersonalDataAction = async (
  input: TDataRequestInput,
): Promise<TErasePersonalDataResult> => {
  await requireSuperAdmin();

  const result = await runDataRequest(input, {
    run: queries.personalData.erasePersonalData,
    action: AUDIT_ACTION.PERSONAL_DATA_ERASED,
    auditDetails: ({ erased }) => erased,
  });
  if (!result.ok) return result.error;

  return {
    outcome: ACTION_OUTCOME.SUCCESS,
    erasedCount: Object.values(result.data.erased).reduce(
      (sum, count) => sum + count,
      0,
    ),
  };
};
