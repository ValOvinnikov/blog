import { Inter } from 'next/font/google';

// See fraunces-font.ts: Editorial's fonts opt out of preload as a deliberate,
// scoped trade-off (Console, the site default, keeps preloading).
export const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-body-family',
  preload: false,
});
