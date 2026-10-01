import localFont from 'next/font/local';

export const newsreader = localFont({
  src: [
    { path: './fonts/newsreader.woff2', weight: '400 500', style: 'normal' },
    {
      path: './fonts/newsreader-italic.woff2',
      weight: '400 500',
      style: 'italic',
    },
  ],
  variable: '--font-body-family',
  display: 'swap',
});
