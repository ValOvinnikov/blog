import localFont from 'next/font/local';

export const spaceGrotesk = localFont({
  src: [
    { path: './fonts/space-grotesk.woff2', weight: '400 700', style: 'normal' },
  ],
  variable: '--font-display-family',
  display: 'swap',
});
