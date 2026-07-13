import type { ILocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import { HomePageTemplate } from '@web/components/home-page-template/home-page-template';
import { HeroModule } from '@web/modules/hero/hero-module';
import { ModuleRenderer } from '@web/modules/module-renderer';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ILocalizedParams>;
};

export async function generateMetadata(): Promise<Metadata> {
  const [homeResult, settingsResult] = await Promise.all([
    service.pages.home.v1.getHomePage(),
    service.global.siteSettings.v1.getSiteSettings(),
  ]);

  const home = homeResult.ok ? homeResult.data : null;
  const settings = settingsResult.ok ? settingsResult.data : null;
  const title =
    home?.seo?.metaTitle ??
    home?.seo?.ogTitle ??
    settings?.ogTitle ??
    settings?.brand.name ??
    'Blog';
  const description =
    home?.seo?.metaDescription ??
    home?.seo?.ogDescription ??
    settings?.ogDescription ??
    settings?.description ??
    '';
  const ogTitle = home?.seo?.ogTitle ?? title;
  const ogDescription = home?.seo?.ogDescription ?? description;
  const imageUrl = home?.seo?.ogImageUrl ?? settings?.ogImageUrl;
  const images = imageUrl ? [{ url: imageUrl }] : [];

  return {
    title,
    description,
    alternates: { canonical: '/' },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      images,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: images.map((image) => image.url),
    },
  };
}

export default async function HomePage({ params }: TProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const result = await service.pages.home.v1.getHomePage();
  console.log('Home page result:', result);
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
