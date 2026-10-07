import localFont from 'next/font/local';

export const interHeading = localFont({
  src: [{ path: './fonts/inter.woff2', weight: '400 500', style: 'normal' }],
  variable: '--font-display-family',
  display: 'swap',
  preload: false,
});
