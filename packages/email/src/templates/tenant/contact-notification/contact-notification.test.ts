import {
  MOCK_ESCAPED_SCRIPT_MARKUP,
  MOCK_ESCAPED_UNSAFE_MARKUP,
  MOCK_JAVASCRIPT_URL,
  MOCK_SCRIPT_MARKUP,
  MOCK_TENANT_NAME,
  MOCK_UNSAFE_MARKUP,
  MOCK_URL,
} from '@blog/email/testing/email-fixtures';
import { MOCK_TENANT_EMAIL_BRAND } from '@blog/email/testing/tenant-email-brand';
import { faker } from '@faker-js/faker';

import {
  buildContactNotificationEmail,
  type TContactNotificationEmailInput,
} from './contact-notification';

faker.seed(6026);

const MOCK_VISITOR_NAME = faker.lorem.words(2);
const MOCK_VISITOR_EMAIL = faker.internet.email();
const MOCK_MESSAGE = faker.lorem.sentence();
const MOCK_PAGE_URL = `${MOCK_URL}/en/contact`;
const MOCK_LEADS_URL = `${MOCK_URL}/en/dashboard/leads`;

const MOCK_INPUT: TContactNotificationEmailInput = {
  siteName: MOCK_TENANT_NAME,
  visitorName: MOCK_VISITOR_NAME,
  visitorEmail: MOCK_VISITOR_EMAIL,
  message: MOCK_MESSAGE,
  pageUrl: MOCK_PAGE_URL,
  leadsUrl: MOCK_LEADS_URL,
  brand: MOCK_TENANT_EMAIL_BRAND,
};

describe(buildContactNotificationEmail, () => {
  describe('for a visitor message', () => {
    let email: ReturnType<typeof buildContactNotificationEmail>;

    beforeEach(() => {
      email = buildContactNotificationEmail(MOCK_INPUT);
    });

    it('names the visitor in the subject', () => {
      expect(email.subject).toContain(MOCK_VISITOR_NAME);
    });

    it('names the visitor, their email and the message in the body', () => {
      expect(email.html).toContain(MOCK_VISITOR_NAME);
      expect(email.html).toContain(MOCK_VISITOR_EMAIL);
      expect(email.html).toContain(MOCK_MESSAGE);
    });

    it.each([
      ['the page the message was sent from', MOCK_PAGE_URL],
      ['the Leads list', MOCK_LEADS_URL],
    ])('links %s', (_name, url) => {
      expect(email.html).toContain(`href="${url}"`);
    });
  });

  it('renders HTML in the message as text', () => {
    const { html } = buildContactNotificationEmail({
      ...MOCK_INPUT,
      message: MOCK_UNSAFE_MARKUP,
    });

    expect(html).not.toContain(MOCK_UNSAFE_MARKUP);
    expect(html).toContain(MOCK_ESCAPED_UNSAFE_MARKUP);
  });

  it('renders HTML in the visitor name and email as text', () => {
    const { html } = buildContactNotificationEmail({
      ...MOCK_INPUT,
      visitorName: MOCK_UNSAFE_MARKUP,
      visitorEmail: `${MOCK_SCRIPT_MARKUP}@example.com`,
    });

    expect(html).not.toContain(MOCK_UNSAFE_MARKUP);
    expect(html).not.toContain(MOCK_SCRIPT_MARKUP);
    expect(html).toContain(MOCK_ESCAPED_UNSAFE_MARKUP);
    expect(html).toContain(MOCK_ESCAPED_SCRIPT_MARKUP);
  });

  it('keeps the line breaks of the message', () => {
    const { html } = buildContactNotificationEmail({
      ...MOCK_INPUT,
      message: 'First line\nSecond line\r\nThird line',
    });

    expect(html).toContain('First line<br />Second line<br />Third line');
  });

  it('does not link a page url with an unsafe scheme', () => {
    const { html } = buildContactNotificationEmail({
      ...MOCK_INPUT,
      pageUrl: MOCK_JAVASCRIPT_URL,
    });

    expect(html).not.toContain(`href="${MOCK_JAVASCRIPT_URL}"`);
  });
});
