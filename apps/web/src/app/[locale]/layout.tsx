import type { ILocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import { NavLink } from '@blog/ui/atoms';
import { Footer, Header } from '@blog/ui/organisms';
import { BrandLockupLink } from '@web/components/shared/brand-lockup-link';
import { SiteNavigation } from '@web/components/shared/site-navigation';
import { SmartLink } from '@web/components/shared/smart-link';
import { ThemeToggleButton } from '@web/components/shared/theme-toggle-button';
import { routing } from '@web/i18n/routing';
import { env } from '@web/utils/env/env';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

import { localeLayoutVariants } from './layout-variants';

export async function generateMetadata(): Promise<Metadata> {
  const result = await service.global.siteSettings.v1.getSiteSettings();

  // Every route's own `openGraph`/`twitter` replaces (not merges with) this
  // root segment's — `metadataBase` is the one field that still inherits
  // down (see `toMetadata`), which is what lets a leaf's relative fallback
  // image path resolve to an absolute URL.
  const metadataBase = env.NEXT_PUBLIC_SITE_URL
    ? new URL(env.NEXT_PUBLIC_SITE_URL)
    : undefined;

  if (!result.ok) {
    console.error(`Error to fetch site settings: ${result.error}`);
    return { metadataBase };
  }

  const { brand, description } = result.data;

  return {
    metadataBase,
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
  const s = localeLayoutVariants();

  return (
    // `locale` is passed explicitly (not inherited) so the page stays
    // statically rendered; `messages={null}` — this app localizes routing
    // only, it ships no translation messages. Client components that read
    // the locale (next-intl navigation `Link` in the post-list module)
    // need this provider or they throw "No intl context found".

    // TODO: revisit this config (pass real messages, re-check static
    // rendering) when translation messages are introduced.
    <NextIntlClientProvider locale={locale} messages={null}>
      {/* `root` is the sticky-footer shell: `min-h-dvh flex-col` so short
          pages still fill the viewport, `content` is `flex-1` so it grows to
          push `Footer` to the bottom on short pages and yields naturally
          (no overlap) once page content exceeds the viewport. */}
      <div className={s.root()}>
        <Header>
          <Header.Brand>
            <BrandLockupLink brand={brand} />
          </Header.Brand>
          <SiteNavigation links={navItems} actions={<ThemeToggleButton />} />
        </Header>
        <div className={s.content()}>{children}</div>
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
      </div>
    </NextIntlClientProvider>
  );
}
