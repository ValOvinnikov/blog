import localFont from 'next/font/local';

export const jetbrainsMono = localFont({
  src: [
    {
      path: './fonts/jetbrains-mono.woff2',
      weight: '400 800',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-platform-mono-family',
  preload: false,
});
