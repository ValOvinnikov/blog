import { EMAIL_USAGE_LEVEL } from '@shinefold/config/constants';
import {
  PLATFORM_EMAIL_BRAND,
  PLATFORM_EMAIL_DARK_BRAND,
} from '@shinefold/email/html/platform-email-brand/platform-email-brand';
import {
  MOCK_ESCAPED_UNSAFE_MARKUP,
  MOCK_UNSAFE_MARKUP,
} from '@shinefold/email/testing/email-fixtures';
import {
  MOCK_NEAR_USAGE_ROW,
  MOCK_NORMAL_USAGE_ROW,
  MOCK_OWNER_LIMIT_EMAIL_INPUT,
} from '@shinefold/email/testing/owner-email';

import {
  buildOwnerLimitEmail,
  type TOwnerLimitEmailInput,
} from './owner-limit-email';

const NEAR_BAR_WIDTH = 'width="84%"';

describe(buildOwnerLimitEmail, () => {
  describe('with every part given', () => {
    let email: ReturnType<typeof buildOwnerLimitEmail>;

    beforeEach(() => {
      email = buildOwnerLimitEmail(MOCK_OWNER_LIMIT_EMAIL_INPUT);
    });

    it('passes the subject through unchanged', () => {
      expect(email.subject).toBe(MOCK_OWNER_LIMIT_EMAIL_INPUT.subject);
    });

    it('shows the wordmark, heading, closing line and footer', () => {
      const { brandName, heading, closingLine, footerLine } =
        MOCK_OWNER_LIMIT_EMAIL_INPUT;

      expect(email.html).toContain(brandName);
      expect(email.html).toContain(`${heading}</h1>`);
      expect(email.html).toContain(closingLine);
      expect(email.html).toContain(footerLine);
    });

    it('links the action as a button', () => {
      const { label, url } = MOCK_OWNER_LIMIT_EMAIL_INPUT.action;

      expect(email.html).toContain(`href="${url}"`);
      expect(email.html).toContain(label);
    });

    it('shows each usage row with its value', () => {
      for (const { label, value } of [
        MOCK_NEAR_USAGE_ROW,
        MOCK_NORMAL_USAGE_ROW,
      ]) {
        expect(email.html).toContain(label);
        expect(email.html).toContain(value);
      }
    });

    it('draws a bar only for the row that asks for one, filled to its share of the limit', () => {
      const barFills = email.html.match(/width="\d+%"[^>]*99px 0 0 99px/g);

      expect(barFills).toHaveLength(1);
      expect(barFills?.[0]).toContain(NEAR_BAR_WIDTH);
    });

    it('colours the near row in the warning colour and the other row muted', () => {
      expect(email.html).toContain(
        `color:${PLATFORM_EMAIL_BRAND.warn};">${MOCK_NEAR_USAGE_ROW.value}`,
      );
      expect(email.html).toContain(
        `color:${PLATFORM_EMAIL_BRAND.textMuted};">${MOCK_NORMAL_USAGE_ROW.value}`,
      );
    });

    it('switches to the Shinefold dark palette in a dark-mode client', () => {
      expect(email.html).toContain(PLATFORM_EMAIL_DARK_BRAND.surface);
      expect(email.html).toContain(PLATFORM_EMAIL_DARK_BRAND.warn);
    });

    it('returns a plain-text alternative with the usage, closing line, action and footer', () => {
      const { closingLine, footerLine, action } = MOCK_OWNER_LIMIT_EMAIL_INPUT;

      expect(email.text).toContain(
        `${MOCK_NEAR_USAGE_ROW.label}: ${MOCK_NEAR_USAGE_ROW.value}`,
      );
      expect(email.text).toContain(closingLine);
      expect(email.text).toContain(action.url);
      expect(email.text).toContain(footerLine);
    });
  });

  it('fills an over-limit bar to the end in the over colour', () => {
    const { html } = buildOwnerLimitEmail({
      ...MOCK_OWNER_LIMIT_EMAIL_INPUT,
      usage: [
        {
          ...MOCK_NEAR_USAGE_ROW,
          used: MOCK_NEAR_USAGE_ROW.limit + MOCK_NEAR_USAGE_ROW.limit,
          level: EMAIL_USAGE_LEVEL.OVER,
        },
      ],
    });

    expect(html).toContain(
      `width="100%" cellpadding="0" cellspacing="0" bgcolor="${PLATFORM_EMAIL_BRAND.bad}"`,
    );
  });

  it('leaves out the heading, usage box and footer when none is given', () => {
    const { brandName, subject, paragraphs, action } =
      MOCK_OWNER_LIMIT_EMAIL_INPUT;
    const { html } = buildOwnerLimitEmail({
      brandName,
      subject,
      paragraphs,
      action,
    });

    expect(html).not.toContain('<h1');
    expect(html).not.toContain(PLATFORM_EMAIL_BRAND.surfaceHead);
  });

  it.each<[string, Partial<TOwnerLimitEmailInput>]>([
    ['heading', { heading: MOCK_UNSAFE_MARKUP }],
    ['closing line', { closingLine: MOCK_UNSAFE_MARKUP }],
    ['footer', { footerLine: MOCK_UNSAFE_MARKUP }],
    [
      'usage label',
      { usage: [{ ...MOCK_NEAR_USAGE_ROW, label: MOCK_UNSAFE_MARKUP }] },
    ],
  ])('shows markup in the %s as text', (_part, override) => {
    const { html } = buildOwnerLimitEmail({
      ...MOCK_OWNER_LIMIT_EMAIL_INPUT,
      paragraphs: [],
      ...override,
    });

    expect(html).not.toContain(MOCK_UNSAFE_MARKUP);
    expect(html).toContain(MOCK_ESCAPED_UNSAFE_MARKUP);
  });
});
