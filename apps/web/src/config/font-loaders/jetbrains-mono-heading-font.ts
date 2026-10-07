import localFont from 'next/font/local';

export const jetbrainsMonoHeading = localFont({
  src: [
    {
      path: './fonts/jetbrains-mono.woff2',
      weight: '400 500',
      style: 'normal',
    },
  ],
  variable: '--font-display-family',
  display: 'swap',
  preload: false,
});
