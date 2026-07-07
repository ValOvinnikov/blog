import type { ILocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import { Hero, PostCard, PostGrid } from '@blog/ui';
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
  const result = await service.global.siteSettings.v1.getSiteSettings();
  const settings = result.ok ? result.data : null;
  const title = settings?.ogTitle ?? settings?.title ?? 'Blog';
  const description = settings?.ogDescription ?? settings?.description ?? '';
  const images = settings?.ogImageUrl ? [{ url: settings.ogImageUrl }] : [];

  return {
    title,
    description,
    alternates: { canonical: '/' },
    openGraph: { title, description, images, type: 'website' },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
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

  console.info(result.data);
  const { featuredPosts, recentPosts } = result.data;

  const featuredPost = featuredPosts[0];

  return (
    <Container as="main">
      {featuredPost && (
        <Hero
          eyebrow={featuredPost.categories[0]?.title}
          title={featuredPost.title}
          excerpt={featuredPost.excerpt}
          tags={featuredPost.categories.map((category) => category.title)}
          publishedAt={featuredPost.publishedAt}
          formattedDate={formatDate(featuredPost.publishedAt, locale)}
          ariaLabel="Featured post"
        >
          <Hero.Media key="media">
            {featuredPost.mainImageUrl && (
              <Image
                src={featuredPost.mainImageUrl}
                alt={featuredPost.mainImageAlt}
                fill
                className="object-cover"
                priority
              />
            )}
          </Hero.Media>
          <Hero.Cta key="cta">
            <Link href={`/blog/${featuredPost.slug}`}>Read more</Link>
          </Hero.Cta>
        </Hero>
      )}

      {recentPosts.length > 0 && (
        <PostGrid>
          {recentPosts.map((post) => (
            <PostCard
              key={post.id}
              excerpt={post.excerpt}
              tags={post.categories.map((category) => category.title)}
              publishedAt={post.publishedAt}
              formattedDate={formatDate(post.publishedAt, locale)}
              authorName={post.author?.name}
              authorAvatarSrc={post.author?.imageUrl}
            >
              <PostCard.Media key="media">
                {post.mainImageUrl && (
                  <Image
                    src={post.mainImageUrl}
                    alt={post.mainImageAlt}
                    fill
                    className="object-cover"
                  />
                )}
              </PostCard.Media>
              <PostCard.Title key="title">
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </PostCard.Title>
            </PostCard>
          ))}
        </PostGrid>
      )}
    </Container>
  );
}
