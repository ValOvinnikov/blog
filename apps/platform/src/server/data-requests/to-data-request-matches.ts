import 'server-only';

import type { TMaybeUndefined } from '@blog/config';
import type { TPersonalDataCounts } from '@blog/db/queries/personal-data/erase-personal-data';
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
  recordedAt: Date;
};

const toMatch = (
  kind: TDataRequestMatchKind,
  id: string,
  siteName: TMaybeUndefined<string>,
  email: TMaybeUndefined<string>,
  recordedAt: Date,
): TDataRequestMatch => ({
  key: `${kind}-${id}`,
  kind,
  siteName,
  email,
  recordedAt,
});

export type TPersonalDataMatchCounts = TPersonalDataCounts & {
  auditEvents: number;
};

export const toDataRequestMatches = ({
  subscribers,
  leads,
  membershipInvites,
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
  blockedSignupIdentities,
  auditEvents,
}: TPersonalDataMatches): TPersonalDataMatchCounts => ({
  subscribers: subscribers.length,
  leads: leads.length,
  membershipInvites: membershipInvites.length,
  blockedSignupIdentities: blockedSignupIdentities.length,
  auditEvents: auditEvents.length,
});
