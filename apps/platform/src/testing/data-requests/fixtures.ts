import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import type { TPersonalDataMatches } from '@blog/db/queries/personal-data/find-personal-data';
import { SUBSCRIBER_STATUS } from '@blog/db/schema/subscribers';
import { faker } from '@faker-js/faker';
import { DATA_REQUEST_MATCH_KIND } from '@platform/constants/data-request';
import type { TPersonalDataExport } from '@platform/server/data-requests/export-personal-data-action';
import type { TDataRequestMatch } from '@platform/server/data-requests/to-data-request-matches';

export const MOCK_DATA_REQUEST_EMAIL = faker.internet.email().toLowerCase();
export const MOCK_DATA_REQUEST_EMAIL_INDEX = faker.string.alphanumeric(43);
export const MOCK_DATA_REQUEST_SITE_NAME = faker.company.name();
export const MOCK_NOT_AN_EMAIL = faker.lorem.slug();

const TENANT_ID = faker.string.uuid();
const SUBSCRIBER_ID = faker.string.uuid();
const SUBSCRIBER_STATUS_VALUE = faker.helpers.arrayElement(SUBSCRIBER_STATUS);
const LEAD_ID = faker.string.uuid();
const LEAD_NAME = faker.person.fullName();
const LEAD_MESSAGE = faker.lorem.sentence();
const LEAD_SOURCE_PATH = faker.system.directoryPath();
const INVITE_ID = faker.string.uuid();
const BLOCK_ID = faker.string.uuid();
const BLOCK_REASON = faker.lorem.sentence();
const AUDIT_EVENT_ID = faker.string.uuid();
const RECORDED_AT = faker.date.past();

export const mockPersonalDataMatches = (
  overrides: Partial<TPersonalDataMatches> = {},
): TPersonalDataMatches => ({
  emailIndex: MOCK_DATA_REQUEST_EMAIL_INDEX,
  subscribers: [
    {
      tenantId: TENANT_ID,
      tenantName: MOCK_DATA_REQUEST_SITE_NAME,
      id: SUBSCRIBER_ID,
      email: MOCK_DATA_REQUEST_EMAIL,
      status: SUBSCRIBER_STATUS_VALUE,
      subscribedAt: RECORDED_AT,
      confirmedAt: RECORDED_AT,
    },
  ],
  leads: [
    {
      tenantId: TENANT_ID,
      tenantName: MOCK_DATA_REQUEST_SITE_NAME,
      id: LEAD_ID,
      name: LEAD_NAME,
      email: MOCK_DATA_REQUEST_EMAIL,
      message: LEAD_MESSAGE,
      sourcePath: LEAD_SOURCE_PATH,
      createdAt: RECORDED_AT,
    },
  ],
  membershipInvites: [
    {
      tenantId: TENANT_ID,
      tenantName: MOCK_DATA_REQUEST_SITE_NAME,
      id: INVITE_ID,
      email: MOCK_DATA_REQUEST_EMAIL,
      role: MEMBERSHIP_ROLE.EDITOR,
      createdAt: RECORDED_AT,
      consumedAt: undefined,
    },
  ],
  blockedSignupIdentities: [
    {
      id: BLOCK_ID,
      reason: BLOCK_REASON,
      createdAt: RECORDED_AT,
    },
  ],
  auditEvents: [
    {
      id: AUDIT_EVENT_ID,
      email: MOCK_DATA_REQUEST_EMAIL,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: TENANT_ID,
      createdAt: RECORDED_AT,
    },
  ],
  ...overrides,
});

export const mockPersonalDataExport = (): TPersonalDataExport => {
  const {
    subscribers,
    leads,
    membershipInvites,
    blockedSignupIdentities,
    auditEvents,
  } = mockPersonalDataMatches();

  return {
    subscribers,
    leads,
    membershipInvites,
    blockedSignupIdentities,
    auditEvents,
  };
};

export const MOCK_ONE_OF_EACH_COUNT = {
  subscribers: 1,
  leads: 1,
  membershipInvites: 1,
  blockedSignupIdentities: 1,
  auditEvents: 1,
};

export const mockDataRequestMatch = (
  overrides: Partial<TDataRequestMatch> = {},
): TDataRequestMatch => ({
  key: `${DATA_REQUEST_MATCH_KIND.SUBSCRIBER}-${SUBSCRIBER_ID}`,
  kind: DATA_REQUEST_MATCH_KIND.SUBSCRIBER,
  siteName: MOCK_DATA_REQUEST_SITE_NAME,
  email: MOCK_DATA_REQUEST_EMAIL,
  recordedAt: RECORDED_AT,
  ...overrides,
});
