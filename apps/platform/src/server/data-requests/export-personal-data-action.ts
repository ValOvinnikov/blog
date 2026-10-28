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

export type TPersonalDataExportHeader = {
  generatedAt: string;
  searchedEmail: string;
  operatorId: string;
};

export type TPersonalDataExport = TPersonalDataExportHeader &
  Omit<TPersonalDataMatches, 'emailIndex'>;

export type TExportPersonalDataResult =
  | { outcome: typeof ACTION_OUTCOME.SUCCESS; data: TPersonalDataExport }
  | TDataRequestFailure;

export const exportPersonalDataAction = async (
  input: TDataRequestInput,
): Promise<TExportPersonalDataResult> => {
  const { userId } = await requireSuperAdmin();

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
    unsentStudioReinvites,
    readerAccount,
    blockedSignupIdentities,
    auditEvents,
  } = result.data;

  return {
    outcome: ACTION_OUTCOME.SUCCESS,
    data: {
      generatedAt: new Date().toISOString(),
      searchedEmail: input.email.trim(),
      operatorId: userId,
      subscribers,
      leads,
      membershipInvites,
      unsentStudioReinvites,
      readerAccount,
      blockedSignupIdentities,
      auditEvents,
    },
  };
};
