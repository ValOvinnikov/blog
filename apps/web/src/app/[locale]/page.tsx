import type { ILocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import { HomePageTemplate } from '@web/components/page-templates/home-page-template';
import { toMetadata } from '@web/metadata/to-metadata';
import { HeroModule } from '@web/modules/hero/hero-module';
import { ModuleRenderer } from '@web/modules/module-renderer';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ILocalizedParams>;
};

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantSanityContext();
  const result = await service.pages.home.v1.getHomePage(tenant);

  if (!result.ok) {
    logger.error('home_page.metadata_fetch_failed', { error: result.error });
    return {};
  }

  if (!result.data) {
    return {};
  }

  return toMetadata(result.data.seo, {
    canonical: '/',
    ogType: 'website',
    titleAbsolute: true,
  });
}

export default async function HomePage({ params }: TProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tenant = await getTenantSanityContext();
  const result = await service.pages.home.v1.getHomePage(tenant);
  const { hero, modules } = guardPageLoaderResult(
    result,
    'home_page.fetch_failed',
  );

  return (
    <HomePageTemplate
      hero={<HeroModule id={hero.id} locale={locale} />}
      modules={<ModuleRenderer modules={modules} locale={locale} />}
    />
  );
}
