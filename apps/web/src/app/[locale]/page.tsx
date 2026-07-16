import type { ILocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import { HomePageTemplate } from '@web/components/home-page-template/home-page-template';
import { toMetadata } from '@web/metadata/to-metadata';
import { HeroModule } from '@web/modules/hero/hero-module';
import { ModuleRenderer } from '@web/modules/module-renderer';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ILocalizedParams>;
};

export async function generateMetadata(): Promise<Metadata> {
  const result = await service.pages.home.v1.getHomePage();

  if (!result.ok) {
    console.error(`Error to fetch home page metadata: ${result.error}`);
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

  const result = await service.pages.home.v1.getHomePage();

  if (!result.ok) {
    console.error(`Error to fetch home page: ${result.error}`);
    notFound();
  }

  const { hero, modules } = result.data;

  return (
    <HomePageTemplate
      hero={<HeroModule id={hero.id} locale={locale} />}
      modules={<ModuleRenderer modules={modules} locale={locale} />}
    />
  );
}
