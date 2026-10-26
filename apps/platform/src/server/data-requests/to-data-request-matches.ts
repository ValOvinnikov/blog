import 'server-only';

import type { TMaybeUndefined } from '@blog/config';
import type { TPersonalDataMatches } from '@blog/db/queries/personal-data/find-personal-data';
import {
  DATA_REQUEST_MATCH_KIND,
  type TDataRequestMatchKind,
} from '@platform/constants/data-request';

export type TDataRequestMatch = {
  key: string;
  kind: TDataRequestMatchKind;
  siteName: TMaybeUndefined<string>;
  email: TMaybeUndefined<string>;
  recordedAt: TMaybeUndefined<Date>;
};

const toMatch = (
  kind: TDataRequestMatchKind,
  id: string,
  siteName: TMaybeUndefined<string>,
  email: TMaybeUndefined<string>,
  recordedAt: TMaybeUndefined<Date>,
): TDataRequestMatch => ({
  key: `${kind}-${id}`,
  kind,
  siteName,
  email,
  recordedAt,
});

export type TPersonalDataMatchCounts = Record<
  keyof Omit<TPersonalDataMatches, 'emailIndex'> | 'bookmarks',
  number
>;

export const toDataRequestMatches = ({
  subscribers,
  leads,
  membershipInvites,
  readerAccount,
  blockedSignupIdentities,
  auditEvents,
}: TPersonalDataMatches): TDataRequestMatch[] => [
  ...subscribers.map(({ id, tenantName, email, subscribedAt }) =>
    toMatch(
      DATA_REQUEST_MATCH_KIND.SUBSCRIBER,
      id,
      tenantName,
      email,
      subscribedAt,
    ),
  ),
  ...leads.map(({ id, tenantName, email, createdAt }) =>
    toMatch(DATA_REQUEST_MATCH_KIND.LEAD, id, tenantName, email, createdAt),
  ),
  ...membershipInvites.map(({ id, tenantName, email, createdAt }) =>
    toMatch(DATA_REQUEST_MATCH_KIND.INVITE, id, tenantName, email, createdAt),
  ),
  ...(readerAccount
    ? [
        toMatch(
          DATA_REQUEST_MATCH_KIND.READER_ACCOUNT,
          readerAccount.id,
          undefined,
          readerAccount.email,
          readerAccount.emailVerified,
        ),
        ...readerAccount.bookmarks.map(
          ({ tenantId, tenantName, postId, createdAt }) =>
            toMatch(
              DATA_REQUEST_MATCH_KIND.BOOKMARK,
              `${tenantId}-${postId}`,
              tenantName,
              undefined,
              createdAt,
            ),
        ),
      ]
    : []),
  ...blockedSignupIdentities.map(({ id, createdAt }) =>
    toMatch(
      DATA_REQUEST_MATCH_KIND.SIGNUP_BLOCK,
      id,
      undefined,
      undefined,
      createdAt,
    ),
  ),
  ...auditEvents.map(({ id, createdAt }) =>
    toMatch(
      DATA_REQUEST_MATCH_KIND.AUDIT_EVENT,
      id,
      undefined,
      undefined,
      createdAt,
    ),
  ),
];

export const countPersonalDataMatches = ({
  subscribers,
  leads,
  membershipInvites,
  readerAccount,
  blockedSignupIdentities,
  auditEvents,
}: TPersonalDataMatches): TPersonalDataMatchCounts => ({
  subscribers: subscribers.length,
  leads: leads.length,
  membershipInvites: membershipInvites.length,
  readerAccount: readerAccount ? 1 : 0,
  bookmarks: readerAccount?.bookmarks.length ?? 0,
  blockedSignupIdentities: blockedSignupIdentities.length,
  auditEvents: auditEvents.length,
});
