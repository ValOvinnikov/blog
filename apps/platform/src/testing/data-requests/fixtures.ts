import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import type { TPersonalDataMatches } from '@blog/db/queries/personal-data/find-personal-data';
import { DATA_REQUEST_MATCH_KIND } from '@platform/constants/data-request';
import type { TPersonalDataExport } from '@platform/server/data-requests/export-personal-data-action';
import type { TDataRequestMatch } from '@platform/server/data-requests/to-data-request-matches';

export const DATA_REQUEST_EMAIL = 'reader@example.com';
export const DATA_REQUEST_EMAIL_INDEX = 'index-of-reader-at-example-com';
export const DATA_REQUEST_SITE_NAME = 'Acme Journal';
export const NOT_AN_EMAIL = 'not-an-email';

const TENANT_ID = 'tenant-acme';
const RECORDED_AT = new Date(Date.UTC(2026, 8, 14));

export const makePersonalDataMatches = (
  overrides: Partial<TPersonalDataMatches> = {},
): TPersonalDataMatches => ({
  emailIndex: DATA_REQUEST_EMAIL_INDEX,
  subscribers: [
    {
      tenantId: TENANT_ID,
      tenantName: DATA_REQUEST_SITE_NAME,
      id: 'subscriber-1',
      email: DATA_REQUEST_EMAIL,
      status: 'active',
      subscribedAt: RECORDED_AT,
      confirmedAt: RECORDED_AT,
    },
  ],
  leads: [
    {
      tenantId: TENANT_ID,
      tenantName: DATA_REQUEST_SITE_NAME,
      id: 'lead-1',
      name: 'Ada Lovelace',
      email: DATA_REQUEST_EMAIL,
      message: 'Please call me back.',
      sourcePath: '/en/contact',
      createdAt: RECORDED_AT,
    },
  ],
  membershipInvites: [
    {
      tenantId: TENANT_ID,
      tenantName: DATA_REQUEST_SITE_NAME,
      id: 'invite-1',
      email: DATA_REQUEST_EMAIL,
      role: MEMBERSHIP_ROLE.EDITOR,
      createdAt: RECORDED_AT,
      consumedAt: undefined,
    },
  ],
  blockedSignupIdentities: [
    { id: 'block-1', reason: 'Spam signups', createdAt: RECORDED_AT },
  ],
  auditEvents: [
    {
      id: 'audit-1',
      email: DATA_REQUEST_EMAIL,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: TENANT_ID,
      createdAt: RECORDED_AT,
    },
  ],
  ...overrides,
});

export const makePersonalDataExport = (): TPersonalDataExport => {
  const {
    subscribers,
    leads,
    membershipInvites,
    blockedSignupIdentities,
    auditEvents,
  } = makePersonalDataMatches();

  return {
    subscribers,
    leads,
    membershipInvites,
    blockedSignupIdentities,
    auditEvents,
  };
};

export const ONE_OF_EACH_COUNT = {
  subscribers: 1,
  leads: 1,
  membershipInvites: 1,
  blockedSignupIdentities: 1,
  auditEvents: 1,
};

export const makeDataRequestMatch = (
  overrides: Partial<TDataRequestMatch> = {},
): TDataRequestMatch => ({
  key: 'SUBSCRIBER-subscriber-1',
  kind: DATA_REQUEST_MATCH_KIND.SUBSCRIBER,
  siteName: DATA_REQUEST_SITE_NAME,
  email: DATA_REQUEST_EMAIL,
  recordedAt: RECORDED_AT,
  ...overrides,
});
