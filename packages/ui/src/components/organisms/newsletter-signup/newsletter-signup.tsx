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

/** A controlled subscribe form in two densities: `Full`, a pitch pane beside the form, and `Compact`, a single-row strip. */
export const NewsletterSignup = {
  Full: NewsletterSignupFull,
  Compact: NewsletterSignupCompact,
};
