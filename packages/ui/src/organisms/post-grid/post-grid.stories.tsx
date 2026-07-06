import type { Meta, StoryObj } from '@storybook/react';

import { PostCard } from '../../molecules/post-card';
import { PostGrid } from './post-grid';

const meta: Meta<typeof PostGrid> = {
  title: 'Organisms/PostGrid',
  component: PostGrid,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};
export default meta;

type TStory = StoryObj<typeof PostGrid>;

const posts = [
  {
    href: '/posts/building-a-design-system',
    title: 'Building a Design System from Scratch',
    excerpt:
      'A step-by-step guide to building a scalable, token-driven design system using Tailwind CSS.',
    tags: ['design-system', 'tailwind', 'react'],
    publishedAt: '2024-06-01T00:00:00Z',
    formattedDate: 'June 1, 2024',
    authorName: 'Val Ovinnikov',
  },
  {
    href: '/posts/typescript-tips',
    title: 'TypeScript Tips for 2025',
    excerpt:
      'A collection of practical TypeScript patterns that will level up your code.',
    tags: ['typescript', 'javascript'],
    publishedAt: '2024-05-15T00:00:00Z',
    formattedDate: 'May 15, 2024',
    authorName: 'Val Ovinnikov',
  },
  {
    href: '/posts/atomic-design',
    title: 'Atomic Design in Practice',
    excerpt:
      'How to apply Atomic Design principles to a real-world component library.',
    tags: ['atomic-design', 'components'],
    publishedAt: '2024-04-20T00:00:00Z',
    formattedDate: 'April 20, 2024',
    authorName: 'Val Ovinnikov',
  },
];

export const Default: TStory = {
  render: () => (
    <PostGrid>
      {posts.map(({ href, title, ...rest }) => (
        <PostCard key={href} {...rest}>
          <PostCard.Title>
            <a href={href}>{title}</a>
          </PostCard.Title>
        </PostCard>
      ))}
    </PostGrid>
  ),
};

export const TwoColumn: TStory = {
  render: () => (
    <PostGrid>
      {posts.slice(0, 2).map(({ href, title, ...rest }) => (
        <PostCard key={href} {...rest}>
          <PostCard.Title>
            <a href={href}>{title}</a>
          </PostCard.Title>
        </PostCard>
      ))}
    </PostGrid>
  ),
};
