import {
  MOCK_ESCAPED_UNSAFE_MARKUP,
  MOCK_JAVASCRIPT_URL,
  MOCK_TENANT_NAME,
  MOCK_UNSAFE_MARKUP,
} from '@blog/email/testing/email-fixtures';
import { MOCK_TENANT_EMAIL_BRAND } from '@blog/email/testing/tenant-email-brand';

import {
  buildContactNotificationEmail,
  type TContactNotificationEmailInput,
} from './contact-notification';

const VISITOR_NAME = 'Ada Lovelace';
const VISITOR_EMAIL = 'ada@example.com';
const MESSAGE = 'Hello there';
const UNSAFE_VISITOR_NAME = '<b>Mallory</b>';

const INPUT: TContactNotificationEmailInput = {
  siteName: MOCK_TENANT_NAME,
  visitorName: VISITOR_NAME,
  visitorEmail: VISITOR_EMAIL,
  message: MESSAGE,
  pageUrl: 'https://acme.example/en/contact',
  leadsUrl: 'https://platform.example/en/dashboard/leads',
  brand: MOCK_TENANT_EMAIL_BRAND,
};

describe('buildContactNotificationEmail', () => {
  describe('with the default input', () => {
    let email: ReturnType<typeof buildContactNotificationEmail>;

    beforeEach(() => {
      email = buildContactNotificationEmail(INPUT);
    });

    it('names the visitor in the subject', () => {
      expect(email.subject).toBe('New message from Ada Lovelace');
    });

    it('names the visitor, their email and the message in the body', () => {
      expect(email.html).toContain(VISITOR_NAME);
      expect(email.html).toContain(VISITOR_EMAIL);
      expect(email.html).toContain(MESSAGE);
    });

    it('links the page the message was sent from', () => {
      expect(email.html).toContain('href="https://acme.example/en/contact"');
    });

    it('links the Leads list', () => {
      expect(email.html).toContain(
        'href="https://platform.example/en/dashboard/leads"',
      );
    });

    it('tells the owner that replying answers the visitor', () => {
      expect(email.html).toContain(
        'Reply to this email to answer Ada Lovelace directly.',
      );
    });
  });

  it('renders HTML in the message as text', () => {
    const { html } = buildContactNotificationEmail({
      ...INPUT,
      message: MOCK_UNSAFE_MARKUP,
    });

    expect(html).not.toContain(MOCK_UNSAFE_MARKUP);
    expect(html).toContain(MOCK_ESCAPED_UNSAFE_MARKUP);
  });

  it('renders HTML in the visitor name and email as text', () => {
    const { html } = buildContactNotificationEmail({
      ...INPUT,
      visitorName: UNSAFE_VISITOR_NAME,
      visitorEmail: '"><script>x()</script>@example.com',
    });

    expect(html).not.toContain(UNSAFE_VISITOR_NAME);
    expect(html).not.toContain('<script>x()</script>');
    expect(html).toContain('&lt;b&gt;Mallory&lt;/b&gt;');
  });

  it('keeps the line breaks of the message', () => {
    const { html } = buildContactNotificationEmail({
      ...INPUT,
      message: 'First line\nSecond line\r\nThird line',
    });

    expect(html).toContain('First line<br />Second line<br />Third line');
  });

  it('does not link a page url with an unsafe scheme', () => {
    const { html } = buildContactNotificationEmail({
      ...INPUT,
      pageUrl: MOCK_JAVASCRIPT_URL,
    });

    expect(html).not.toContain(`href="${MOCK_JAVASCRIPT_URL}"`);
  });
});
