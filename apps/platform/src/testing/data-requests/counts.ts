import type { TPersonalDataCounts } from '@blog/db/queries/personal-data/erase-personal-data';
import type { TPersonalDataMatchCounts } from '@platform/server/data-requests/count-personal-data-matches';

export const MOCK_ONE_OF_EACH_COUNT = {
  subscribers: 1,
  leads: 1,
  membershipInvites: 1,
  unsentStudioReinvites: 1,
  selfServeOwnerSites: 1,
  readerAccounts: 1,
} satisfies TPersonalDataCounts;

export const MOCK_ONE_OF_EACH_MATCH_COUNT = {
  subscribers: 1,
  leads: 1,
  membershipInvites: 1,
  unsentStudioReinvites: 1,
  selfServeOwnerSites: 1,
  readerAccount: 1,
  bookmarks: 1,
  blockedSignupIdentities: 1,
  auditEvents: 1,
} satisfies TPersonalDataMatchCounts;
