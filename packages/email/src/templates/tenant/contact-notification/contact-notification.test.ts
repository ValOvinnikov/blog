import { TENANT_EMAIL_BRAND as BRAND } from '@blog/email/testing/tenant-email-brand';

import {
  buildContactNotificationEmail,
  type TContactNotificationEmailInput,
} from './contact-notification';

const INPUT: TContactNotificationEmailInput = {
  siteName: 'Acme Blog',
  visitorName: 'Ada Lovelace',
  visitorEmail: 'ada@example.com',
  message: 'Hello there',
  pageUrl: 'https://acme.example/en/contact',
  leadsUrl: 'https://platform.example/en/dashboard/leads',
  brand: BRAND,
};

describe('buildContactNotificationEmail', () => {
  it('names the visitor in the subject', () => {
    const { subject } = buildContactNotificationEmail(INPUT);

    expect(subject).toBe('New message from Ada Lovelace');
  });

  it('names the visitor, their email and the message in the body', () => {
    const { html } = buildContactNotificationEmail(INPUT);

    expect(html).toContain('Ada Lovelace');
    expect(html).toContain('ada@example.com');
    expect(html).toContain('Hello there');
  });

  it('links the page the message was sent from', () => {
    const { html } = buildContactNotificationEmail(INPUT);

    expect(html).toContain('href="https://acme.example/en/contact"');
  });

  it('links the Leads list', () => {
    const { html } = buildContactNotificationEmail(INPUT);

    expect(html).toContain(
      'href="https://platform.example/en/dashboard/leads"',
    );
  });

  it('tells the owner that replying answers the visitor', () => {
    const { html } = buildContactNotificationEmail(INPUT);

    expect(html).toContain(
      'Reply to this email to answer Ada Lovelace directly.',
    );
  });

  it('renders HTML in the message as text', () => {
    const { html } = buildContactNotificationEmail({
      ...INPUT,
      message: '<img src=x onerror=steal()>',
    });

    expect(html).not.toContain('<img src=x onerror=steal()>');
    expect(html).toContain('&lt;img src=x onerror=steal()&gt;');
  });

  it('renders HTML in the visitor name and email as text', () => {
    const { html } = buildContactNotificationEmail({
      ...INPUT,
      visitorName: '<b>Mallory</b>',
      visitorEmail: '"><script>x()</script>@example.com',
    });

    expect(html).not.toContain('<b>Mallory</b>');
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
      pageUrl: 'javascript:alert(1)',
    });

    expect(html).not.toContain('href="javascript:alert(1)"');
  });
});
