import { faker } from '@faker-js/faker';
import {
  MOCK_EMAIL_ADDRESS,
  MOCK_ESCAPED_UNSAFE_MARKUP,
  MOCK_TENANT_NAME,
  MOCK_UNSAFE_MARKUP,
  MOCK_URL,
} from '@shinefold/email/testing/email-fixtures';

import {
  buildSupportRequestEmail,
  type TSupportRequestEmailInput,
} from './support-request';

faker.seed(7184);

const MOCK_SUBJECT = faker.lorem.words(3);
const MOCK_MESSAGE_LINES = [faker.lorem.sentence(), faker.lorem.sentence()];
const MOCK_PLAN = faker.lorem.word();
const MOCK_STATUS = faker.lorem.word();
const MOCK_ROLE = faker.lorem.word();
const MOCK_ORIGIN_PAGE = `/dashboard/${faker.lorem.word()}`;

const MOCK_INPUT: TSupportRequestEmailInput = {
  subject: MOCK_SUBJECT,
  message: MOCK_MESSAGE_LINES.join('\n'),
  siteName: MOCK_TENANT_NAME,
  siteAddress: MOCK_URL,
  plan: MOCK_PLAN,
  status: MOCK_STATUS,
  senderEmail: MOCK_EMAIL_ADDRESS,
  senderRole: MOCK_ROLE,
  originPage: MOCK_ORIGIN_PAGE,
};

describe(buildSupportRequestEmail, () => {
  let email: ReturnType<typeof buildSupportRequestEmail>;

  beforeEach(() => {
    email = buildSupportRequestEmail(MOCK_INPUT);
  });

  it('names the subject and the site in the email subject', () => {
    expect(email.subject).toContain(MOCK_SUBJECT);
    expect(email.subject).toContain(MOCK_TENANT_NAME);
  });

  it.each([
    ['site address', MOCK_URL],
    ['plan', MOCK_PLAN],
    ['status', MOCK_STATUS],
    ['sender', MOCK_EMAIL_ADDRESS],
    ['role', MOCK_ROLE],
    ['originating page', MOCK_ORIGIN_PAGE],
  ])('carries the %s in the html and the text', (_name, value) => {
    expect(email.html).toContain(value);
    expect(email.text).toContain(value);
  });

  it('keeps the line breaks of the message', () => {
    expect(email.html).toContain(MOCK_MESSAGE_LINES.join('<br />'));
    expect(email.text).toContain(MOCK_MESSAGE_LINES.join('\n'));
  });

  it.each([
    ['message', 'message'],
    ['subject', 'subject'],
    ['site name', 'siteName'],
  ] as const)('renders HTML in the %s as text', (_name, key) => {
    const { html } = buildSupportRequestEmail({
      ...MOCK_INPUT,
      [key]: MOCK_UNSAFE_MARKUP,
    });

    expect(html).not.toContain(MOCK_UNSAFE_MARKUP);
    expect(html).toContain(MOCK_ESCAPED_UNSAFE_MARKUP);
  });
});
