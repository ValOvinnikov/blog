import { PLATFORM_EMAIL_BRAND } from '@blog/email/html/platform-email-brand/platform-email-brand';
import {
  COPYRIGHT_ENTITY,
  MOCK_ATTRIBUTE_BREAKOUT,
  MOCK_EMAIL_ACTION,
  MOCK_EMAIL_SUBJECT,
  MOCK_ESCAPED_UNSAFE_MARKUP,
  MOCK_NOW,
  MOCK_PERCENT_ENCODED_ATTRIBUTE_BREAKOUT,
  MOCK_PLATFORM_BRAND_NAME,
  MOCK_UNSAFE_MARKUP,
  MOCK_URL,
} from '@blog/email/testing/email-fixtures';
import { faker } from '@faker-js/faker';

import { buildOwnerEmail } from './owner-email';

faker.seed(6026);

const MOCK_PARAGRAPH = faker.lorem.sentence();
const MOCK_SECOND_PARAGRAPH = faker.lorem.sentence();
const MOCK_PREVIEW_TEXT = faker.lorem.words(4);

describe(buildOwnerEmail, () => {
  describe('with copy and an action', () => {
    let email: ReturnType<typeof buildOwnerEmail>;

    beforeEach(() => {
      vi.useFakeTimers({ now: MOCK_NOW });
      email = buildOwnerEmail({
        brandName: MOCK_PLATFORM_BRAND_NAME,
        subject: MOCK_EMAIL_SUBJECT,
        previewText: MOCK_PREVIEW_TEXT,
        paragraphs: [MOCK_PARAGRAPH, MOCK_SECOND_PARAGRAPH],
        action: MOCK_EMAIL_ACTION,
      });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('passes the subject through unchanged', () => {
      expect(email.subject).toBe(MOCK_EMAIL_SUBJECT);
    });

    it('renders each paragraph as its own paragraph', () => {
      expect(email.html).toContain(
        `<p>${MOCK_PARAGRAPH}</p><p>${MOCK_SECOND_PARAGRAPH}</p>`,
      );
    });

    it('renders the preview text in the preheader', () => {
      expect(email.html).toContain(`${MOCK_PREVIEW_TEXT}</div>`);
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
        `${MOCK_PARAGRAPH}\n\n${MOCK_SECOND_PARAGRAPH}\n\n${MOCK_EMAIL_ACTION.label}: ${MOCK_EMAIL_ACTION.url}`,
      );
    });

    it('names the brand and the current year in the copyright line', () => {
      expect(email.html).toContain(
        `${COPYRIGHT_ENTITY} ${MOCK_NOW.getFullYear()} ${MOCK_PLATFORM_BRAND_NAME}`,
      );
    });
  });

  it('renders no action when none is given', () => {
    const { html } = buildOwnerEmail({
      brandName: MOCK_PLATFORM_BRAND_NAME,
      subject: MOCK_EMAIL_SUBJECT,
      paragraphs: [MOCK_PARAGRAPH],
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
      paragraphs: [MOCK_PARAGRAPH],
      action: {
        ...MOCK_EMAIL_ACTION,
        url: `${MOCK_URL}/?q=${MOCK_ATTRIBUTE_BREAKOUT}`,
      },
    });

    expect(html).not.toContain(MOCK_ATTRIBUTE_BREAKOUT);
    expect(html).toContain(MOCK_PERCENT_ENCODED_ATTRIBUTE_BREAKOUT);
  });
});
