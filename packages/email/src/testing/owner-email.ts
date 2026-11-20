import { EMAIL_USAGE_LEVEL } from '@shinefold/config/constants';
import type { TEmailAction } from '@shinefold/email/html/email-action/email-action';
import type { TEmailDetail } from '@shinefold/email/html/email-details/email-details';
import type { TOwnerEmailInput } from '@shinefold/email/templates/owner/owner-email/owner-email';
import type { TOwnerLimitEmailInput } from '@shinefold/email/templates/owner/owner-limit-email/owner-limit-email';
import type { TOwnerUsageRow } from '@shinefold/email/templates/owner/owner-usage-box/owner-usage-box';
import {
  MOCK_EMAIL_ACTION,
  MOCK_EMAIL_SUBJECT,
  MOCK_PLATFORM_BRAND_NAME,
  MOCK_UNSAFE_MARKUP,
} from '@shinefold/email/testing/email-fixtures';
import { createMockFaker } from '@shinefold/email/testing/mock-faker';

const ownerEmailFaker = createMockFaker(6876);

export const MOCK_OWNER_EMAIL_INPUT: TOwnerEmailInput & {
  action: TEmailAction;
} = {
  brandName: MOCK_PLATFORM_BRAND_NAME,
  subject: MOCK_EMAIL_SUBJECT,
  paragraphs: [MOCK_UNSAFE_MARKUP],
  action: MOCK_EMAIL_ACTION,
};

function mockEmailDetail(): TEmailDetail {
  return {
    label: ownerEmailFaker.lorem.word({ length: { min: 5, max: 10 } }),
    value: ownerEmailFaker.commerce.price({ symbol: '$' }),
  };
}

export const MOCK_EMAIL_DETAILS: TEmailDetail[] = [
  mockEmailDetail(),
  mockEmailDetail(),
];

export const MOCK_NEAR_USAGE_ROW: TOwnerUsageRow = {
  label: ownerEmailFaker.lorem.word({ length: { min: 5, max: 10 } }),
  value: '842 of 1,000',
  used: 842,
  limit: 1000,
  level: EMAIL_USAGE_LEVEL.NEAR,
  hasBar: true,
};

export const MOCK_NORMAL_USAGE_ROW: TOwnerUsageRow = {
  label: ownerEmailFaker.lorem.word({ length: { min: 5, max: 10 } }),
  value: '2,526 of 6,000',
  used: 2526,
  limit: 6000,
  level: EMAIL_USAGE_LEVEL.NORMAL,
};

export const MOCK_OWNER_LIMIT_EMAIL_INPUT: TOwnerLimitEmailInput = {
  ...MOCK_OWNER_EMAIL_INPUT,
  heading: ownerEmailFaker.lorem.sentence(),
  usage: [MOCK_NEAR_USAGE_ROW, MOCK_NORMAL_USAGE_ROW],
  closingLine: ownerEmailFaker.lorem.sentence(),
  footerLine: ownerEmailFaker.lorem.sentence(),
};
