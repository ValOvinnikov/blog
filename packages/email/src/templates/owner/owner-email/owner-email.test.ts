import { PLATFORM_EMAIL_BRAND } from '@blog/email/html/platform-email-brand/platform-email-brand';
import {
  ESCAPED_UNSAFE_MARKUP,
  TEST_PLATFORM_BRAND_NAME,
  UNSAFE_MARKUP,
} from '@blog/email/testing/email-fixtures';

import { buildOwnerEmail } from './owner-email';

const SUBJECT = 'Your site is ready';
const LIVE_PARAGRAPH = 'Acme Blog is live.';
const ACTION = {
  label: 'Open your site',
  url: 'https://acme.example.com/welcome',
};

describe(buildOwnerEmail, () => {
  describe('with copy and an action', () => {
    let email: ReturnType<typeof buildOwnerEmail>;

    beforeEach(() => {
      email = buildOwnerEmail({
        brandName: TEST_PLATFORM_BRAND_NAME,
        subject: SUBJECT,
        previewText: 'Acme Blog is live',
        paragraphs: [LIVE_PARAGRAPH, 'Open it to start writing.'],
        action: ACTION,
      });
    });

    it('passes the subject through unchanged', () => {
      expect(email.subject).toBe(SUBJECT);
    });

    it('renders each paragraph as its own paragraph', () => {
      expect(email.html).toContain(
        '<p>Acme Blog is live.</p><p>Open it to start writing.</p>',
      );
    });

    it('renders the preview text in the preheader', () => {
      expect(email.html).toContain('Acme Blog is live</div>');
    });

    it('renders the action as a button in the platform palette', () => {
      expect(email.html).toContain(`href="${ACTION.url}"`);
      expect(email.html).toContain(`>${ACTION.label}</a>`);
      expect(email.html).toContain(
        `background-color:${PLATFORM_EMAIL_BRAND.brandPrimarySolid}`,
      );
    });

    it('carries the copy and action as plain text', () => {
      expect(email.text).toBe(
        `Acme Blog is live.\n\nOpen it to start writing.\n\n${ACTION.label}: ${ACTION.url}`,
      );
    });

    it('names the brand in the shell', () => {
      expect(email.html).toContain(
        `&copy; ${new Date().getFullYear()} ${TEST_PLATFORM_BRAND_NAME}`,
      );
    });
  });

  it('renders no action when none is given', () => {
    const { html } = buildOwnerEmail({
      brandName: TEST_PLATFORM_BRAND_NAME,
      subject: 'Heads up',
      paragraphs: ['Sanity has emailed you an invite.'],
    });

    expect(html).not.toContain('<a ');
  });

  it('escapes every caller-supplied value', () => {
    const { html } = buildOwnerEmail({
      brandName: UNSAFE_MARKUP,
      subject: UNSAFE_MARKUP,
      previewText: UNSAFE_MARKUP,
      paragraphs: [UNSAFE_MARKUP],
      action: { label: UNSAFE_MARKUP, url: 'https://example.com' },
    });

    expect(html).not.toContain(UNSAFE_MARKUP);
    expect(html).toContain(ESCAPED_UNSAFE_MARKUP);
  });

  it('percent-encodes an unsafe action url', () => {
    const { html } = buildOwnerEmail({
      brandName: TEST_PLATFORM_BRAND_NAME,
      subject: SUBJECT,
      paragraphs: [LIVE_PARAGRAPH],
      action: {
        ...ACTION,
        url: `https://example.com/?q="><img src=x onerror=alert(1)>`,
      },
    });

    expect(html).not.toContain('"><img src=x onerror=alert(1)>');
    expect(html).toContain('%22%3E%3Cimg%20src=x%20onerror=alert(1)%3E');
  });
});
