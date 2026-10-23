import { PLATFORM_EMAIL_BRAND } from '@blog/email/html/platform-email-brand/platform-email-brand';
import {
  MOCK_ATTRIBUTE_BREAKOUT,
  MOCK_EMAIL_ACTION,
  MOCK_EMAIL_SUBJECT,
  MOCK_ESCAPED_UNSAFE_MARKUP,
  MOCK_PERCENT_ENCODED_ATTRIBUTE_BREAKOUT,
  MOCK_PLATFORM_BRAND_NAME,
  MOCK_UNSAFE_MARKUP,
  MOCK_URL,
} from '@blog/email/testing/email-fixtures';

import { buildOwnerEmail } from './owner-email';

const LIVE_PARAGRAPH = 'Acme Blog is live.';

describe(buildOwnerEmail, () => {
  describe('with copy and an action', () => {
    let email: ReturnType<typeof buildOwnerEmail>;

    beforeEach(() => {
      email = buildOwnerEmail({
        brandName: MOCK_PLATFORM_BRAND_NAME,
        subject: MOCK_EMAIL_SUBJECT,
        previewText: 'Acme Blog is live',
        paragraphs: [LIVE_PARAGRAPH, 'Open it to start writing.'],
        action: MOCK_EMAIL_ACTION,
      });
    });

    it('passes the subject through unchanged', () => {
      expect(email.subject).toBe(MOCK_EMAIL_SUBJECT);
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
      expect(email.html).toContain(`href="${MOCK_EMAIL_ACTION.url}"`);
      expect(email.html).toContain(`>${MOCK_EMAIL_ACTION.label}</a>`);
      expect(email.html).toContain(
        `background-color:${PLATFORM_EMAIL_BRAND.brandPrimarySolid}`,
      );
    });

    it('carries the copy and action as plain text', () => {
      expect(email.text).toBe(
        `Acme Blog is live.\n\nOpen it to start writing.\n\n${MOCK_EMAIL_ACTION.label}: ${MOCK_EMAIL_ACTION.url}`,
      );
    });

    it('names the brand in the shell', () => {
      expect(email.html).toContain(
        `&copy; ${new Date().getFullYear()} ${MOCK_PLATFORM_BRAND_NAME}`,
      );
    });
  });

  it('renders no action when none is given', () => {
    const { html } = buildOwnerEmail({
      brandName: MOCK_PLATFORM_BRAND_NAME,
      subject: 'Heads up',
      paragraphs: ['Sanity has emailed you an invite.'],
    });

    expect(html).not.toContain('<a ');
  });

  it('escapes every caller-supplied value', () => {
    const { html } = buildOwnerEmail({
      brandName: MOCK_UNSAFE_MARKUP,
      subject: MOCK_UNSAFE_MARKUP,
      previewText: MOCK_UNSAFE_MARKUP,
      paragraphs: [MOCK_UNSAFE_MARKUP],
      action: { label: MOCK_UNSAFE_MARKUP, url: MOCK_URL },
    });

    expect(html).not.toContain(MOCK_UNSAFE_MARKUP);
    expect(html).toContain(MOCK_ESCAPED_UNSAFE_MARKUP);
  });

  it('percent-encodes an unsafe action url', () => {
    const { html } = buildOwnerEmail({
      brandName: MOCK_PLATFORM_BRAND_NAME,
      subject: MOCK_EMAIL_SUBJECT,
      paragraphs: [LIVE_PARAGRAPH],
      action: {
        ...MOCK_EMAIL_ACTION,
        url: `https://example.com/?q="><img src=x onerror=alert(1)>`,
      },
    });

    expect(html).not.toContain(MOCK_ATTRIBUTE_BREAKOUT);
    expect(html).toContain(MOCK_PERCENT_ENCODED_ATTRIBUTE_BREAKOUT);
  });
});
