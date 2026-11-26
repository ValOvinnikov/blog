import type { TPersonalDataExport } from '@platform/server/data-requests/export-personal-data-action';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import {
  MOCK_DATA_REQUEST_EMAIL,
  MOCK_EXPORT_GENERATED_AT,
  mockPersonalDataMatches,
} from '@platform/testing/data-requests/fixtures';
import type { TPersonalDataMatches } from '@shinefold/db/queries/personal-data/find-personal-data';

const NO_PERSONAL_DATA = {
  subscribers: [],
  leads: [],
  membershipInvites: [],
  unsentStudioReinvites: [],
  selfServeOwnerSites: [],
  readerAccount: undefined,
  blockedSignupIdentities: [],
  auditEvents: [],
} satisfies Omit<TPersonalDataMatches, 'emailIndex'>;

export const mockEmptyPersonalDataMatches = (): TPersonalDataMatches =>
  mockPersonalDataMatches(NO_PERSONAL_DATA);

export const mockPersonalDataExport = (): TPersonalDataExport => {
  const {
    subscribers,
    leads,
    membershipInvites,
    unsentStudioReinvites,
    selfServeOwnerSites,
    readerAccount,
    blockedSignupIdentities,
    auditEvents,
  } = mockPersonalDataMatches();

  return {
    generatedAt: MOCK_EXPORT_GENERATED_AT.toISOString(),
    searchedEmail: MOCK_DATA_REQUEST_EMAIL,
    operatorId: mockAdmin().userId,
    isDataHeld: true,
    subscribers,
    leads,
    membershipInvites,
    unsentStudioReinvites,
    selfServeOwnerSites,
    readerAccount,
    blockedSignupIdentities,
    auditEvents,
  };
};

export const mockEmptyPersonalDataExport = (): TPersonalDataExport => ({
  ...mockPersonalDataExport(),
  ...NO_PERSONAL_DATA,
  isDataHeld: false,
});
