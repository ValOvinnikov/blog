import localFont from 'next/font/local';

// Next's font optimization is build-time and can't know a per-request-
// resolved CMS theme, so preloading both presets' fonts by default would
// cost every tenant. Editorial is the less-common preset (Console is the
// site default), so its fonts opt out of preload — a deliberate trade-off,
// not an oversight.
export const fraunces = localFont({
  src: [
    { path: './fonts/fraunces.woff2', weight: '400 600', style: 'normal' },
    {
      path: './fonts/fraunces-italic.woff2',
      weight: '400 600',
      style: 'italic',
    },
  ],
  variable: '--font-display-family',
  display: 'swap',
  preload: false,
});
