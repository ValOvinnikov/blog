import { type TPostCard } from '@blog/service';
import { Hero } from '@blog/ui';
import Image from 'next/image';
import Link from 'next/link';

export const heroSlots = (post: TPostCard) => {
  const cta = (
    <Hero.Cta key="cta">
      <Link href={`/blog/${post.slug}`}>Read more</Link>
    </Hero.Cta>
  );

  if (!post.mainImageUrl) return cta;

  return [
    <Hero.Media key="media">
      <Image
        src={post.mainImageUrl}
        alt={post.mainImageAlt}
        fill
        className="object-cover"
        priority
      />
    </Hero.Media>,
    cta,
  ];
};
