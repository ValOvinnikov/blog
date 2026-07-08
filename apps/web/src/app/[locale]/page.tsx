import type { ILocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import {
  ContentSection,
  Hero,
  LinkButton,
  NavLink,
  PostCard,
  PostGrid,
} from '@blog/ui';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/container/container';
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
    settings?.title ??
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
  console.info(latestPosts);
  return (
    <Container as="main" className="py-page-y">
      <Hero
        eyebrow={hero.eyebrow}
        title={hero.title}
        excerpt={hero.subtitle}
        ariaLabel="Featured post"
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

        {hero.image && (
          <Hero.Media key="media">
            <Image
              src={hero.image.src}
              alt={hero.image.alt}
              fill
              className="object-cover"
              priority
            />
          </Hero.Media>
        )}
      </Hero>

      {latestPosts.length > 0 && (
        <ContentSection title={latestPostsTitle} titleId="latest-posts-title">
          <PostGrid>
            {latestPosts.map((post) => (
              <PostCard
                key={post.id}
                excerpt={post.excerpt}
                publishedAt={post.publishedAt}
                formattedDate={formatDate(post.publishedAt, locale)}
                tags={post.categories.map((category) => category.title)}
              >
                <PostCard.Title key="title">
                  <NavLink as={Link} href={`/blog/${post.slug}`}>
                    {post.title}
                  </NavLink>
                </PostCard.Title>
              </PostCard>
            ))}
          </PostGrid>
        </ContentSection>
      )}
    </Container>
  );
}
