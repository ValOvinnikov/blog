import { service } from '@blog/service';
import { Hero, PostCard, PostGrid } from '@blog/ui';
import type { Metadata } from 'next';

import { Container } from '@/components/container/container';
import { cardSlots } from '@/utils/card-slots';
import { formatDate } from '@/utils/format-date';
import { heroSlots } from '@/utils/hero-slots';

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

export default async function HomePage() {
  const { featuredPosts, recentPosts } =
    await service.pages.home.v1.getHomePage();

  const featuredPost = featuredPosts[0];

  return (
    <Container as="main" className="py-section">
      {featuredPost && (
        <Hero
          eyebrow={featuredPost.categories[0]?.title}
          title={featuredPost.title}
          excerpt={featuredPost.excerpt}
          tags={featuredPost.categories.map((category) => category.title)}
          publishedAt={featuredPost.publishedAt}
          formattedDate={formatDate(featuredPost.publishedAt)}
          ariaLabel="Featured post"
        >
          {heroSlots(featuredPost)}
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
              formattedDate={formatDate(post.publishedAt)}
              authorName={post.author?.name}
              authorAvatarSrc={post.author?.imageUrl}
            >
              {cardSlots(post)}
            </PostCard>
          ))}
        </PostGrid>
      )}
    </Container>
  );
}
