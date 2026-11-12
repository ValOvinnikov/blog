import type { TEmailAction } from '@blog/email/html/email-action/email-action';
import type { TEmailDetail } from '@blog/email/html/email-details/email-details';
import type { TOwnerEmailInput } from '@blog/email/templates/owner/owner-email/owner-email';
import {
  MOCK_EMAIL_ACTION,
  MOCK_EMAIL_SUBJECT,
  MOCK_PLATFORM_BRAND_NAME,
  MOCK_UNSAFE_MARKUP,
} from '@blog/email/testing/email-fixtures';

export const MOCK_OWNER_EMAIL_INPUT: TOwnerEmailInput & {
  action: TEmailAction;
} = {
  brandName: MOCK_PLATFORM_BRAND_NAME,
  subject: MOCK_EMAIL_SUBJECT,
  paragraphs: [MOCK_UNSAFE_MARKUP],
  action: MOCK_EMAIL_ACTION,
};

export const MOCK_EMAIL_DETAILS: TEmailDetail[] = [
  { label: 'Amount', value: '$29.00' },
  { label: 'Plan', value: 'Growth' },
];
