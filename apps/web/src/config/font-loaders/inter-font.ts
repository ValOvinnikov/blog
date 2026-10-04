import localFont from 'next/font/local';

export const inter = localFont({
  src: [{ path: './fonts/inter.woff2', weight: '400 500', style: 'normal' }],
  variable: '--font-body-family',
  display: 'swap',
  preload: false,
});
