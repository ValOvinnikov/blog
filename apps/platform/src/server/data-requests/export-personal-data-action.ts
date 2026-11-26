'use server';

import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { countPersonalDataMatches } from '@platform/server/data-requests/count-personal-data-matches';
import {
  runDataRequest,
  type TDataRequestFailure,
  type TDataRequestInput,
} from '@platform/server/data-requests/run-data-request';
import { toDataRequestMatches } from '@platform/server/data-requests/to-data-request-matches';
import { ACTION_OUTCOME, AUDIT_ACTION } from '@shinefold/config';
import { queries } from '@shinefold/db';
import type { TPersonalDataMatches } from '@shinefold/db/queries/personal-data/find-personal-data';
import { hasLength } from '@shinefold/utils/primitives';

export type TPersonalDataExportHeader = {
  generatedAt: string;
  searchedEmail: string;
  operatorId: string;
  isDataHeld: boolean;
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
    selfServeOwnerSites,
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
      isDataHeld: hasLength(toDataRequestMatches(result.data)),
      subscribers,
      leads,
      membershipInvites,
      unsentStudioReinvites,
      selfServeOwnerSites,
      readerAccount,
      blockedSignupIdentities,
      auditEvents,
    },
  };
};
