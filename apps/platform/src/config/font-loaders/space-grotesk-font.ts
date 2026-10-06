import localFont from 'next/font/local';

export const spaceGrotesk = localFont({
  src: [
    { path: './fonts/space-grotesk.woff2', weight: '500 600', style: 'normal' },
  ],
  display: 'swap',
  preload: false,
});
