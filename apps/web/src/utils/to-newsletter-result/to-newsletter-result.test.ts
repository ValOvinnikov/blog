import { toNewsletterResult } from './to-newsletter-result';

describe(toNewsletterResult, () => {
  it.each([
    ['confirmed', 'CONFIRMED'],
    ['confirm-unavailable', 'CONFIRM_UNAVAILABLE'],
    ['unsubscribe-invalid', 'UNSUBSCRIBE_INVALID'],
  ])('reads the %s path segment as %s', (slug, result) => {
    expect(toNewsletterResult(slug)).toBe(result);
  });

  it.each(['', 'CONFIRMED', 'Confirmed', 'subscribed'])(
    'rejects the unknown segment %j',
    (slug) => {
      expect(toNewsletterResult(slug)).toBeUndefined();
    },
  );
});
