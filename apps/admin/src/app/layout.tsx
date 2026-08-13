import '../../index.css';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin',
};

type TProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: TProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
