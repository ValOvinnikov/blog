import { Fraunces } from 'next/font/google';

// Next's font optimization is build-time and can't know a per-request-
// resolved CMS theme, so preloading both presets' fonts by default would
// cost every tenant. Editorial is the less-common preset (Console is the
// site default), so its fonts opt out of preload — a deliberate trade-off,
// not an oversight.
export const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-display-family',
  preload: false,
});
