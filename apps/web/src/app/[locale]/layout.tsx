import '../../../index.css';

import type { ILocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import { Footer, Header, NavLink, ThemeToggle } from '@blog/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

import { jetbrainsMono, newsreader, spaceGrotesk } from '@/config/fonts';
import { routing } from '@/i18n/routing';

export async function generateMetadata(): Promise<Metadata> {
  const result = await service.global.siteSettings.v1.getSiteSettings();

  if (!result.ok) {
    console.error(`Error to fetch site settings: ${result.error}`);
    return {};
  }

  const { title, description } = result.data;

  return {
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type TProps = {
  children: React.ReactNode;
  params: Promise<ILocalizedParams>;
};

export default async function LocaleLayout({ children, params }: TProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const result = await service.global.siteSettings.v1.getSiteSettings();

  if (!result.ok) {
    console.error(`Error to fetch site settings: ${result.error}`);
    notFound();
  }

  const { title, navigation, socialLinks } = result.data;

  return (
    <html
      lang={locale}
      className={`${spaceGrotesk.variable} ${newsreader.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
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
