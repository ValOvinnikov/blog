import { type TPostCard } from '@blog/service';
import { PostCard } from '@blog/ui';
import Image from 'next/image';
import Link from 'next/link';

export const cardSlots = (post: TPostCard) => {
  const title = (
    <PostCard.Title key="title">
      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
    </PostCard.Title>
  );

  if (!post.mainImageUrl) return title;

  return [
    <PostCard.Media key="media">
      <Image
        src={post.mainImageUrl}
        alt={post.mainImageAlt}
        fill
        className="object-cover"
      />
    </PostCard.Media>,
    title,
  ];
};
