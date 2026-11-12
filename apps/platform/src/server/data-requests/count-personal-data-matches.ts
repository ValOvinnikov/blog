import 'server-only';

import type { TPersonalDataMatches } from '@blog/db/queries/personal-data/find-personal-data';

export type TPersonalDataMatchCounts = Record<
  keyof Omit<TPersonalDataMatches, 'emailIndex'> | 'bookmarks',
  number
>;

export const countPersonalDataMatches = ({
  subscribers,
  leads,
  membershipInvites,
  unsentStudioReinvites,
  selfServeOwnerSites,
  readerAccount,
  blockedSignupIdentities,
  auditEvents,
}: TPersonalDataMatches): TPersonalDataMatchCounts => ({
  subscribers: subscribers.length,
  leads: leads.length,
  membershipInvites: membershipInvites.length,
  unsentStudioReinvites: unsentStudioReinvites.length,
  selfServeOwnerSites: selfServeOwnerSites.length,
  readerAccount: readerAccount ? 1 : 0,
  bookmarks: readerAccount?.bookmarks.length ?? 0,
  blockedSignupIdentities: blockedSignupIdentities.length,
  auditEvents: auditEvents.length,
});
