import localFont from 'next/font/local';

export const jetbrainsMonoBody = localFont({
  src: [
    {
      path: './fonts/jetbrains-mono.woff2',
      weight: '400 500',
      style: 'normal',
    },
  ],
  variable: '--font-body-family',
  display: 'swap',
  preload: false,
});
