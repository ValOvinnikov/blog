import localFont from 'next/font/local';

export const spaceGroteskBody = localFont({
  src: [
    { path: './fonts/space-grotesk.woff2', weight: '400 700', style: 'normal' },
  ],
  variable: '--font-body-family',
  display: 'swap',
  preload: false,
});
