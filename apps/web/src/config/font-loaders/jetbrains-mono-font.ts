import localFont from 'next/font/local';

export const jetbrainsMono = localFont({
  src: [
    {
      path: './fonts/jetbrains-mono.woff2',
      weight: '400 800',
      style: 'normal',
    },
  ],
  variable: '--font-mono-family',
  display: 'swap',
});
