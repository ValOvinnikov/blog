import {
  NewsletterSignupCompact,
  type TNewsletterSignupCompactProps,
} from './components/compact/newsletter-signup-compact';
import { NewsletterSignupForm } from './components/form/newsletter-signup-form';
import {
  NewsletterSignupFull,
  type INewsletterSignupTrustCue,
  type TNewsletterSignupFullProps,
} from './components/full/newsletter-signup-full';
import { NewsletterSignupInput } from './components/input/newsletter-signup-input';
import { NewsletterSignupStatus } from './components/status/newsletter-signup-status';
import { NewsletterSignupSubmit } from './components/submit/newsletter-signup-submit';

export type {
  INewsletterSignupTrustCue,
  TNewsletterSignupCompactProps,
  TNewsletterSignupFullProps,
};

/** A controlled subscribe form, placed in one of two densities: `Full`, a pitch pane beside the form, or `Compact`, a single-row strip. */
export const NewsletterSignup = {
  Full: NewsletterSignupFull,
  Compact: NewsletterSignupCompact,
  Form: NewsletterSignupForm,
  Input: NewsletterSignupInput,
  Submit: NewsletterSignupSubmit,
  Status: NewsletterSignupStatus,
};
