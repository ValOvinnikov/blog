import localFont from 'next/font/local';

export const newsreader = localFont({
  src: [
    { path: './fonts/newsreader.woff2', weight: '400 500', style: 'normal' },
  ],
  display: 'swap',
  preload: false,
});
