import { NEWSLETTER_RESULT, NEWSLETTER_RESULT_SLUGS } from '@blog/config';
import { faker } from '@faker-js/faker';

import { toNewsletterResult } from './to-newsletter-result';

faker.seed(6012);

const MOCK_UNKNOWN_SLUG = faker.lorem.word();

describe(toNewsletterResult, () => {
  it.each(Object.values(NEWSLETTER_RESULT))(
    'reads the path segment of %s back as that result',
    (result) => {
      expect(toNewsletterResult(NEWSLETTER_RESULT_SLUGS[result])).toBe(result);
    },
  );

  it.each([
    { case: 'empty', slug: '' },
    {
      case: 'the result name itself',
      slug: NEWSLETTER_RESULT.CONFIRMED,
    },
    {
      case: 'differently cased',
      slug: NEWSLETTER_RESULT_SLUGS[NEWSLETTER_RESULT.CONFIRMED].toUpperCase(),
    },
    { case: 'unknown', slug: MOCK_UNKNOWN_SLUG },
  ])('rejects a segment that is $case', ({ slug }) => {
    expect(toNewsletterResult(slug)).toBeUndefined();
  });
});
