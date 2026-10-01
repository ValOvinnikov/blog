import localFont from 'next/font/local';

export const fraunces = localFont({
  src: [{ path: './fonts/fraunces.woff2', weight: '400 600', style: 'normal' }],
  display: 'swap',
  preload: false,
});
