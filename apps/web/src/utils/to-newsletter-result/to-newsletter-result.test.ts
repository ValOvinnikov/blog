import { NEWSLETTER_RESULT } from '@blog/config';

import { toNewsletterResult } from './to-newsletter-result';

describe(toNewsletterResult, () => {
  it.each([
    ['confirmed', NEWSLETTER_RESULT.CONFIRMED],
    ['confirm-unavailable', NEWSLETTER_RESULT.CONFIRM_UNAVAILABLE],
    ['unsubscribe-invalid', NEWSLETTER_RESULT.UNSUBSCRIBE_INVALID],
  ])('reads the %s path segment as %s', (slug, result) => {
    expect(toNewsletterResult(slug)).toBe(result);
  });

  it.each(['', NEWSLETTER_RESULT.CONFIRMED, 'Confirmed', 'subscribed'])(
    'rejects the unknown segment %j',
    (slug) => {
      expect(toNewsletterResult(slug)).toBeUndefined();
    },
  );
});
