import { hasNewsletterSubscribedCookie } from './has-newsletter-subscribed-cookie';

describe(hasNewsletterSubscribedCookie, () => {
  it('returns true when the cookie is present', () => {
    expect(hasNewsletterSubscribedCookie('newsletter_subscribed=1')).toBe(true);
  });

  it('returns true when the cookie is present among others', () => {
    expect(
      hasNewsletterSubscribedCookie('theme=dark; newsletter_subscribed=1'),
    ).toBe(true);
  });

  it('returns false when the cookie is absent', () => {
    expect(hasNewsletterSubscribedCookie('theme=dark')).toBe(false);
  });

  it('returns false for an empty cookie string', () => {
    expect(hasNewsletterSubscribedCookie('')).toBe(false);
  });

  it('does not match a cookie name that merely starts with the same prefix', () => {
    expect(hasNewsletterSubscribedCookie('newsletter_subscribed_old=1')).toBe(
      false,
    );
  });
});
