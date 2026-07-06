import './globals.css';

import { service } from '@blog/service';
import { Footer, Header, NavLink, ThemeToggle } from '@blog/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { jetbrainsMono, newsreader, spaceGrotesk } from '@/config/fonts';

export const metadata: Metadata = {
  title: 'Blog',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await service.global.siteSettings.v1.getSiteSettings();

  if (!result.ok) {
    console.error(`Error to fetch site settings: ${result.error}`);
    notFound();
  }

  const { title, navigation, socialLinks } = result.data;

  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${newsreader.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Prevent flash of unstyled dark/light mode before hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('theme'),d=window.matchMedia('(prefers-color-scheme:dark)').matches;if(s==='dark'||(s===null&&d)){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark'}}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <Header>
          <Header.Brand>
            <Link href="/">{title}</Link>
          </Header.Brand>
          <Header.Nav>
            {navigation.map((item) => (
              <NavLink key={item.href} href={item.href}>
                {item.label}
              </NavLink>
            ))}
          </Header.Nav>
          <Header.Actions>
            <ThemeToggle />
          </Header.Actions>
        </Header>
        {children}
        <Footer>
          <Footer.Copyright title={title} />
          <Footer.Nav>
            {socialLinks.map((link) => (
              <NavLink key={link.url} href={link.url}>
                {link.platform}
              </NavLink>
            ))}
          </Footer.Nav>
        </Footer>
      </body>
    </html>
  );
}
