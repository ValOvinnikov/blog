import '../../../index.css';

import type { ILocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import { Footer, Header, Logo, NavLink, PrimaryNavigation } from '@blog/ui';
import { SmartLink } from '@web/components/smart-link/smart-link';
import { ThemeToggleButton } from '@web/components/theme-toggle-button/theme-toggle-button';
import { jetbrainsMono, newsreader, spaceGrotesk } from '@web/config/fonts';
import { themeBootstrapScript } from '@web/config/theme-script';
import { routing } from '@web/i18n/routing';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

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
        {/* `locale` is passed explicitly (not inherited) so the page stays
            statically rendered; `messages={null}` — this app localizes routing
            only, it ships no translation messages. Client components that read
            the locale (next-intl navigation `Link` in the post-list module)
            need this provider or they throw "No intl context found". */}
        {/* TODO: revisit this config (pass real messages, re-check static
            rendering) when translation messages are introduced.*/}
        <NextIntlClientProvider locale={locale} messages={null}>
          <Header>
            <Header.Brand>
              <SmartLink href="/" aria-label="Home">
                <Logo prefix={brand.prefix} suffix={brand.suffix} />
              </SmartLink>
            </Header.Brand>
            <PrimaryNavigation
              links={navItems}
              actions={<ThemeToggleButton />}
              linkAs={SmartLink}
            />
          </Header>
          {children}
          <Footer>
            <Footer.Copyright title={brand.name} />
            <Footer.Nav>
              {social.map((link) => (
                <NavLink
                  key={link.href}
                  as={SmartLink}
                  href={link.href}
                  target={link.target}
                >
                  {link.label}
                </NavLink>
              ))}
            </Footer.Nav>
          </Footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
