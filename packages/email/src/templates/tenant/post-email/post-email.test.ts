import { LIST_UNSUBSCRIBE_ONE_CLICK } from '@blog/email/templates/tenant/list-unsubscribe-headers/list-unsubscribe-headers';
import {
  MOCK_ESCAPED_UNSAFE_MARKUP,
  MOCK_ESCAPED_UNSUBSCRIBE_URL,
  MOCK_JAVASCRIPT_URL,
  MOCK_TENANT_NAME,
  MOCK_UNSAFE_MARKUP,
  MOCK_UNSUBSCRIBE_URL,
  MOCK_URL,
} from '@blog/email/testing/email-fixtures';
import { MOCK_TENANT_EMAIL_BRAND } from '@blog/email/testing/tenant-email-brand';
import { faker } from '@faker-js/faker';

import { buildPostEmail, type TPostEmailInput } from './post-email';

faker.seed(7159);

const MOCK_POST_URL = `${MOCK_URL}/en/blog/${faker.lorem.slug()}`;
const MOCK_COVER_IMAGE_URL = `https://cdn.example.com/${faker.string.alphanumeric(8)}.jpg`;
const MOCK_TAKEAWAYS = [faker.lorem.sentence(), faker.lorem.sentence()];

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

    it('renders the title and excerpt', () => {
      expect(email.html).toContain(MOCK_INPUT.title);
      expect(email.html).toContain(MOCK_INPUT.excerpt);
    });

    it('links the post and the escaped unsubscribe url', () => {
      expect(email.html).toContain(`href="${MOCK_POST_URL}"`);
      expect(email.html).toContain(`href="${MOCK_ESCAPED_UNSUBSCRIBE_URL}"`);
    });

    it('renders no cover image and no takeaways', () => {
      expect(email.html).not.toContain('alt=""');
      expect(email.html).not.toContain('<ul');
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

    expect(html).toContain(`<img src="${MOCK_COVER_IMAGE_URL}"`);
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
      expect(html).toContain(`<li style="margin:0 0 8px;">${takeaway}</li>`);
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
});
