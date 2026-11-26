/** Plain data only: `GlobalErrorPage` renders it after the root layout has failed, so nothing here may throw. */
export const errorBoundaryCopy = {
  heading: 'Something went wrong',
  intro: 'An unexpected error occurred. Try reloading the page.',
  tryAgain: 'Try again',
  goHome: 'Go home',
  announcement: 'Something went wrong. You can try again, or go home.',
} as const;
