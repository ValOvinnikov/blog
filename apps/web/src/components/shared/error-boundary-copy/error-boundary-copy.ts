/**
 * Hardcoded English shared by `error-page.tsx` and `global-error-page.tsx` —
 * both render above `NextIntlClientProvider`, so neither can use
 * `useTranslations`. Plain data only; nothing here may throw.
 */
export const errorBoundaryCopy = {
  heading: 'Something went wrong',
  tryAgain: 'Try again',
  goHome: 'Go home',
  announcement: 'Something went wrong. You can try again, or go home.',
} as const;
