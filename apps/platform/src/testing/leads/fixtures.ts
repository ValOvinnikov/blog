import type { TListedLead } from '@blog/db/queries/leads';
import { faker } from '@faker-js/faker';
import type { TInboxLead } from '@platform/server/leads/to-inbox-lead';

export const MOCK_LEAD_ID = faker.string.uuid();
export const MOCK_LEAD_NAME = faker.person.fullName();
const MOCK_LEAD_EMAIL = faker.internet.email();
const MOCK_LEAD_MESSAGE = faker.lorem.sentence();
export const MOCK_LEAD_SOURCE_PATH = `/${faker.lorem.slug()}`;
const MOCK_LEAD_CREATED_AT = new Date('2026-04-02T09:30:00.000Z');

const MOCK_LEAD_FIELDS = {
  id: MOCK_LEAD_ID,
  name: MOCK_LEAD_NAME,
  email: MOCK_LEAD_EMAIL,
  message: MOCK_LEAD_MESSAGE,
  sourcePath: MOCK_LEAD_SOURCE_PATH,
  sourceDocumentId: null,
  sourceLocale: null,
  createdAt: MOCK_LEAD_CREATED_AT,
};

export const mockLead = (
  overrides: Partial<TListedLead> = {},
): TListedLead => ({ ...MOCK_LEAD_FIELDS, readAt: null, ...overrides });

export const mockInboxLead = (
  overrides: Partial<TInboxLead> = {},
): TInboxLead => ({ ...MOCK_LEAD_FIELDS, isRead: false, ...overrides });
