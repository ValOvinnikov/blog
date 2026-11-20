import { faker } from '@faker-js/faker';
import { EMAIL_FONT_STACK, FONT_CHOICE } from '@shinefold/config/constants';
import { POST_BOX_CLASS } from '@shinefold/email/templates/tenant/post-email-frame/post-email-frame';
import { LIST_UNSUBSCRIBE_ONE_CLICK } from '@shinefold/email/templates/tenant/unsubscribe/unsubscribe';
import {
  MOCK_ESCAPED_UNSAFE_MARKUP,
  MOCK_ESCAPED_UNSUBSCRIBE_URL,
  MOCK_JAVASCRIPT_URL,
  MOCK_TENANT_NAME,
  MOCK_UNSAFE_MARKUP,
  MOCK_UNSUBSCRIBE_URL,
  MOCK_URL,
} from '@shinefold/email/testing/email-fixtures';
import {
  MOCK_TENANT_EMAIL_BRAND,
  MOCK_TENANT_EMAIL_DARK_BRAND,
} from '@shinefold/email/testing/tenant-email-brand';

import { buildPostEmail, type TPostEmailInput } from './post-email';

faker.seed(7159);

const MOCK_POST_URL = `${MOCK_URL}/en/blog/${faker.lorem.slug()}`;
const MOCK_COVER_IMAGE_URL = `https://cdn.example.com/${faker.string.alphanumeric(8)}.jpg`;
const MOCK_TAKEAWAYS = [faker.lorem.sentence(), faker.lorem.sentence()];
const MOCK_TEST_BANNER_TEXT = faker.lorem.sentence();

const MOCK_INPUT: TPostEmailInput = {
  subject: faker.lorem.sentence(),
  title: faker.lorem.sentence(),
  excerpt: faker.lorem.paragraph(),
  postUrl: MOCK_POST_URL,
  unsubscribeUrl: MOCK_UNSUBSCRIBE_URL,
  brand: MOCK_TENANT_EMAIL_BRAND,
  brandName: MOCK_TENANT_NAME,
};

describe(buildPostEmail, () => {
  describe('for a post with only the required fields', () => {
    let email: ReturnType<typeof buildPostEmail>;

    beforeEach(() => {
      email = buildPostEmail(MOCK_INPUT);
    });

    it('passes the subject through unchanged', () => {
      expect(email.subject).toBe(MOCK_INPUT.subject);
    });

    it('renders the site name, title and excerpt', () => {
      expect(email.html).toContain(MOCK_TENANT_NAME);
      expect(email.html).toContain(`${MOCK_INPUT.title}</h1>`);
      expect(email.html).toContain(MOCK_INPUT.excerpt);
    });

    it('names the site in the subscriber footer', () => {
      expect(email.text).toContain(MOCK_TENANT_NAME);
    });

    it('renders no dark palette and no test banner', () => {
      expect(email.html).not.toContain(MOCK_TENANT_EMAIL_DARK_BRAND.surface);
      expect(email.html).not.toContain(MOCK_TEST_BANNER_TEXT);
    });

    it('links the post and the escaped unsubscribe url', () => {
      expect(email.html).toContain(`href="${MOCK_POST_URL}"`);
      expect(email.html).toContain(`href="${MOCK_ESCAPED_UNSUBSCRIBE_URL}"`);
    });

    it('renders no cover image and no takeaways box', () => {
      expect(email.html).not.toContain('<img');
      expect(email.html).not.toContain(`class="${POST_BOX_CLASS}"`);
      expect(email.html).not.toContain('<li');
    });

    it('sets one-click List-Unsubscribe headers with the raw url', () => {
      expect(email.headers).toEqual({
        'List-Unsubscribe': `<${MOCK_UNSUBSCRIBE_URL}>`,
        'List-Unsubscribe-Post': LIST_UNSUBSCRIBE_ONE_CLICK,
      });
    });

    it('returns a plain-text alternative carrying both links', () => {
      expect(email.text).toContain(MOCK_INPUT.title);
      expect(email.text).toContain(MOCK_POST_URL);
      expect(email.text).toContain(MOCK_UNSUBSCRIBE_URL);
    });
  });

  it('renders a given cover image', () => {
    const { html } = buildPostEmail({
      ...MOCK_INPUT,
      coverImageUrl: MOCK_COVER_IMAGE_URL,
    });

    expect(html).toContain(`src="${MOCK_COVER_IMAGE_URL}"`);
  });

  it('drops a cover image whose url is unsafe', () => {
    const { html } = buildPostEmail({
      ...MOCK_INPUT,
      coverImageUrl: MOCK_JAVASCRIPT_URL,
    });

    expect(html).not.toContain(MOCK_JAVASCRIPT_URL);
  });

  it('renders each given takeaway in the html and the plain text', () => {
    const { html, text } = buildPostEmail({
      ...MOCK_INPUT,
      takeaways: MOCK_TAKEAWAYS,
    });

    for (const takeaway of MOCK_TAKEAWAYS) {
      expect(html).toContain(takeaway);
      expect(text).toContain(`- ${takeaway}`);
    }
  });

  it.each<[string, Partial<TPostEmailInput>]>([
    ['title', { title: MOCK_UNSAFE_MARKUP }],
    ['excerpt', { excerpt: MOCK_UNSAFE_MARKUP }],
    ['takeaway', { takeaways: [MOCK_UNSAFE_MARKUP] }],
  ])('shows markup in the %s as text', (_field, override) => {
    const { html } = buildPostEmail({ ...MOCK_INPUT, ...override });

    expect(html).not.toContain(MOCK_UNSAFE_MARKUP);
    expect(html).toContain(MOCK_ESCAPED_UNSAFE_MARKUP);
  });

  it('shows the test banner first on a test email', () => {
    const { html, text } = buildPostEmail({
      ...MOCK_INPUT,
      isTest: true,
      testBannerText: MOCK_TEST_BANNER_TEXT,
    });

    expect(html.indexOf(MOCK_TEST_BANNER_TEXT)).toBeLessThan(
      html.indexOf(MOCK_TENANT_NAME, html.indexOf('<body')),
    );
    expect(text.startsWith(MOCK_TEST_BANNER_TEXT)).toBe(true);
  });

  it('never shows the test banner on a subscriber email', () => {
    const { html, text } = buildPostEmail({
      ...MOCK_INPUT,
      isTest: false,
      testBannerText: MOCK_TEST_BANNER_TEXT,
    });

    expect(html).not.toContain(MOCK_TEST_BANNER_TEXT);
    expect(text).not.toContain(MOCK_TEST_BANNER_TEXT);
  });

  it('switches to the given dark palette in a dark-mode client', () => {
    const { html } = buildPostEmail({
      ...MOCK_INPUT,
      darkBrand: MOCK_TENANT_EMAIL_DARK_BRAND,
    });

    for (const color of [
      MOCK_TENANT_EMAIL_DARK_BRAND.surface,
      MOCK_TENANT_EMAIL_DARK_BRAND.text,
      MOCK_TENANT_EMAIL_DARK_BRAND.brandPrimarySolid,
    ]) {
      expect(html).toContain(color);
    }
  });

  it('sets headings and body text in the given fonts', () => {
    const { html } = buildPostEmail({
      ...MOCK_INPUT,
      headingFont: FONT_CHOICE.FRAUNCES,
      bodyFont: FONT_CHOICE.INTER,
    });

    expect(html).toContain(EMAIL_FONT_STACK[FONT_CHOICE.FRAUNCES]);
    expect(html).toContain(EMAIL_FONT_STACK[FONT_CHOICE.INTER]);
  });
});
