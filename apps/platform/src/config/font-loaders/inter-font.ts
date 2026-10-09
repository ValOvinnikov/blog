import localFont from 'next/font/local';

export const inter = localFont({
  src: [{ path: './fonts/inter.woff2', weight: '400 700', style: 'normal' }],
  display: 'swap',
  variable: '--font-admin-family',
  preload: false,
});
