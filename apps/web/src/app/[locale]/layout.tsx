import '../../../index.css';

import type { ILocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import { Footer, Header, Logo, NavLink, PrimaryNavigation } from '@blog/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

import { ThemeToggleButton } from '@/components/theme-toggle-button/theme-toggle-button';
import { jetbrainsMono, newsreader, spaceGrotesk } from '@/config/fonts';
import { themeBootstrapScript } from '@/config/theme-script';
import { routing } from '@/i18n/routing';

export async function generateMetadata(): Promise<Metadata> {
  const result = await service.global.siteSettings.v1.getSiteSettings();

  if (!result.ok) {
    console.error(`Error to fetch site settings: ${result.error}`);
    return {};
  }

  const { brand, description } = result.data;

  return {
    title: {
      default: brand.name,
      template: `%s | ${brand.name}`,
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

  const [settingsResult, navResult, footerResult] = await Promise.all([
    service.global.siteSettings.v1.getSiteSettings(),
    service.global.navigation.v1.getNavigation(),
    service.global.footer.v1.getFooter(),
  ]);

  if (!settingsResult.ok) {
    console.error(`Error to fetch site settings: ${settingsResult.error}`);
    notFound();
  }

  const { brand } = settingsResult.data;
  const navItems = navResult.ok ? navResult.data.items : [];
  const social = footerResult.ok ? footerResult.data.social : [];

  return (
    <html
      lang={locale}
      className={`${spaceGrotesk.variable} ${newsreader.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeBootstrapScript,
          }}
        />
      </head>
      <body>
        <Header>
          <Header.Brand>
            <Link href="/" aria-label="Home">
              <Logo prefix={brand.prefix} suffix={brand.suffix} />
            </Link>
          </Header.Brand>
          <PrimaryNavigation
            links={navItems.map((item) => ({
              href: item.href,
              label: item.label,
            }))}
            actions={<ThemeToggleButton />}
            linkAs={Link}
          />
        </Header>
        {children}
        <Footer>
          <Footer.Copyright title={brand.name} />
          <Footer.Nav>
            {social.map((link) => (
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
