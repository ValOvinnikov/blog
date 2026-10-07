import localFont from 'next/font/local';

export const newsreaderHeading = localFont({
  src: [
    { path: './fonts/newsreader.woff2', weight: '400 500', style: 'normal' },
    {
      path: './fonts/newsreader-italic.woff2',
      weight: '400 500',
      style: 'italic',
    },
  ],
  variable: '--font-display-family',
  display: 'swap',
  preload: false,
});
