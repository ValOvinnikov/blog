import { faker } from '@faker-js/faker';

import {
  toNewsletterPostEmail,
  type TRawNewsletterPostEmail,
} from './newsletter-post-email';

faker.seed(7711);

const MOCK_TITLE = faker.lorem.sentence();
const MOCK_HEADING = faker.lorem.sentence();
const MOCK_SUPPORTING_TEXT = faker.lorem.paragraph();
const MOCK_META_DESCRIPTION = faker.lorem.paragraph();
const MOCK_SLUG = faker.lorem.slug();
const MOCK_COVER_IMAGE_URL = faker.image.url();

const MOCK_POST = {
  title: MOCK_TITLE,
  slug: { _type: 'slug', current: MOCK_SLUG },
  coverImageUrl: MOCK_COVER_IMAGE_URL,
} satisfies TRawNewsletterPostEmail;

describe(toNewsletterPostEmail, () => {
  it('sends the title, slug and cover with an empty excerpt and summary', () => {
    expect(toNewsletterPostEmail(MOCK_POST)).toStrictEqual({
      title: MOCK_TITLE,
      excerpt: '',
      slug: MOCK_SLUG,
      coverImageUrl: MOCK_COVER_IMAGE_URL,
      summary: [],
    });
  });

  it('prefers the heading block over the title and the SEO description', () => {
    const email = toNewsletterPostEmail({
      ...MOCK_POST,
      headingBlock: {
        _type: 'pageHeadingBlock',
        heading: MOCK_HEADING,
        supportingText: MOCK_SUPPORTING_TEXT,
      },
      seo: { _type: 'seo', metaDescription: MOCK_META_DESCRIPTION },
    });

    expect([email?.title, email?.excerpt]).toStrictEqual([
      MOCK_HEADING,
      MOCK_SUPPORTING_TEXT,
    ]);
  });

  it('falls back to the SEO description for the excerpt', () => {
    const email = toNewsletterPostEmail({
      ...MOCK_POST,
      seo: { _type: 'seo', metaDescription: MOCK_META_DESCRIPTION },
    });

    expect(email?.excerpt).toBe(MOCK_META_DESCRIPTION);
  });

  it.each([
    ['a title', { ...MOCK_POST, title: undefined }],
    ['a slug', { ...MOCK_POST, slug: undefined }],
  ])('has nothing to send without %s', (_missing, post) => {
    expect(toNewsletterPostEmail(post)).toBeUndefined();
  });
});
