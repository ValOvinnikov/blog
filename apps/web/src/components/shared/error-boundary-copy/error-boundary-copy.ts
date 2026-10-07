/**
 * Fixed English for `GlobalErrorPage`: it renders when the root layout itself
 * has failed, above `NextIntlClientProvider`, so it is the one error boundary
 * the catalog cannot reach. Plain data only; nothing here may throw.
 */
export const errorBoundaryCopy = {
  heading: 'Something went wrong',
  tryAgain: 'Try again',
  goHome: 'Go home',
  announcement: 'Something went wrong. You can try again, or go home.',
} as const;
