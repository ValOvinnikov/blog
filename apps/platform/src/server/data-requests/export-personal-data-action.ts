'use server';

import { ACTION_OUTCOME, AUDIT_ACTION } from '@blog/config';
import { queries } from '@blog/db';
import type { TPersonalDataMatches } from '@blog/db/queries/personal-data/find-personal-data';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import {
  runDataRequest,
  type TDataRequestFailure,
  type TDataRequestInput,
} from '@platform/server/data-requests/run-data-request';
import { countPersonalDataMatches } from '@platform/server/data-requests/to-data-request-matches';

export type TPersonalDataExport = Omit<TPersonalDataMatches, 'emailIndex'>;

export type TExportPersonalDataResult =
  | { outcome: typeof ACTION_OUTCOME.SUCCESS; data: TPersonalDataExport }
  | TDataRequestFailure;

export const exportPersonalDataAction = async (
  input: TDataRequestInput,
): Promise<TExportPersonalDataResult> => {
  await requireSuperAdmin();

  const result = await runDataRequest(input, {
    run: queries.personalData.findPersonalData,
    action: AUDIT_ACTION.PERSONAL_DATA_EXPORTED,
    auditDetails: countPersonalDataMatches,
  });
  if (!result.ok) return result.error;

  const {
    subscribers,
    leads,
    membershipInvites,
    readerAccount,
    blockedSignupIdentities,
    auditEvents,
  } = result.data;

  return {
    outcome: ACTION_OUTCOME.SUCCESS,
    data: {
      subscribers,
      leads,
      membershipInvites,
      readerAccount,
      blockedSignupIdentities,
      auditEvents,
    },
  };
};
