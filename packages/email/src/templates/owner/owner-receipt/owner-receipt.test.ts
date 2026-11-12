import { buildOwnerEmail } from '@blog/email/templates/owner/owner-email/owner-email';
import {
  MOCK_EMAIL_DETAILS,
  MOCK_OWNER_EMAIL_INPUT,
} from '@blog/email/testing/owner-email';

import { buildOwnerReceiptEmail } from './owner-receipt';

describe(buildOwnerReceiptEmail, () => {
  it('renders the owner email for the given copy, details and invoice action', () => {
    const input = { ...MOCK_OWNER_EMAIL_INPUT, details: MOCK_EMAIL_DETAILS };

    expect(buildOwnerReceiptEmail(input)).toEqual(buildOwnerEmail(input));
  });
});
