import localFont from 'next/font/local';

export const frauncesBody = localFont({
  src: [
    { path: './fonts/fraunces.woff2', weight: '400 600', style: 'normal' },
    {
      path: './fonts/fraunces-italic.woff2',
      weight: '400 600',
      style: 'italic',
    },
  ],
  variable: '--font-body-family',
  display: 'swap',
  preload: false,
});
