import {
  NewsletterSignupCompact,
  type TNewsletterSignupCompactProps,
} from './components/compact/newsletter-signup-compact';
import {
  NewsletterSignupFull,
  type INewsletterSignupTrustCue,
  type TNewsletterSignupFullProps,
} from './components/full/newsletter-signup-full';

export type {
  INewsletterSignupTrustCue,
  TNewsletterSignupCompactProps,
  TNewsletterSignupFullProps,
};

/**
 * NewsletterSignup — a pure, controlled subscribe form built on the
 * `TextInput` atom, exposed as two mutually-exclusive densities rather than
 * a single component with a `variant` switch: `NewsletterSignup.Full` is
 * the rich window-shell form used by the site footer and the CMS
 * page-builder module; `NewsletterSignup.Compact` is the slim single-row
 * strip for the end of every article. Neither takes `children` — both are
 * fully prop-driven, so there is no shared root to render them together.
 */
export const NewsletterSignup = {
  Full: NewsletterSignupFull,
  Compact: NewsletterSignupCompact,
};
