import type { ILocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import { Hero, LinkButton, PostsSection } from '@blog/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { HomePageTemplate } from '@/components/home-page-template/home-page-template';
import { SanityImage } from '@/components/sanity-image/sanity-image';
import { formatDate } from '@/utils/format-date';

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

  if (!result.ok) {
    console.error(`Error to fetch home page: ${result.error}`);
    notFound();
  }

  const { hero, latestPosts, latestPostsTitle } = result.data;

  const posts = latestPosts.map((post) => ({
    id: post.id,
    href: `/blog/${post.slug}`,
    title: post.title,
    excerpt: post.excerpt,
    publishedAt: post.publishedAt,
    formattedDate: formatDate(post.publishedAt, locale),
    categories: post.categories,
  }));

  return (
    <HomePageTemplate
      hero={
        <Hero
          eyebrow={hero.eyebrow}
          title={hero.title}
          titleId="home-hero-title"
          excerpt={hero.subtitle}
        >
          {(hero.primaryAction || hero.secondaryAction) && (
            <Hero.Cta>
              {hero.primaryAction && (
                <LinkButton as={Link} href={hero.primaryAction.href}>
                  {hero.primaryAction.label}
                </LinkButton>
              )}
              {hero.secondaryAction && (
                <LinkButton
                  as={Link}
                  href={hero.secondaryAction.href}
                  variant="link"
                >
                  {hero.secondaryAction.label}
                </LinkButton>
              )}
            </Hero.Cta>
          )}

          {hero.sanityImage && (
            <Hero.Media key="media">
              <SanityImage
                image={hero.sanityImage}
                width={1200}
                height={900}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="size-full object-cover"
              />
            </Hero.Media>
          )}
        </Hero>
      }
      latestPosts={
        <PostsSection
          posts={posts}
          title={latestPostsTitle}
          titleId="latest-posts-title"
          linkAs={Link}
        />
      }
    />
  );
}
