import type { Meta, StoryObj } from '@storybook/react';

import { PostCard } from './post-card';

const meta = {
  title: 'Molecules/PostCard',
  component: PostCard,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    excerpt:
      'A step-by-step guide to building a scalable, token-driven design system using Tailwind CSS, tailwind-variants, and Atomic Design principles.',
    publishedAt: '2024-03-10T09:00:00Z',
    formattedDate: 'March 10, 2024',
    tags: ['design-system', 'tailwind', 'react'],
    authorName: 'Jane Doe',
    authorAvatarSrc: 'https://i.pravatar.cc/150?img=1',
    children: (
      <>
        <PostCard.Media>
          <img
            src="https://picsum.photos/seed/designsystem/800/450"
            alt="Abstract design elements on a dark background"
          />
        </PostCard.Media>
        <PostCard.Title>
          <a href="/posts/building-a-design-system">
            Building a Design System from Scratch
          </a>
        </PostCard.Title>
      </>
    ),
  },
} satisfies Meta<typeof PostCard>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Full: TStory = {};

export const Minimal: TStory = {
  args: {
    excerpt: undefined,
    publishedAt: undefined,
    formattedDate: undefined,
    tags: undefined,
    authorName: undefined,
    authorAvatarSrc: undefined,
    children: (
      <PostCard.Title>
        <a href="/posts/minimal">A Minimal Post</a>
      </PostCard.Title>
    ),
  },
};

export const WithTags: TStory = {
  args: {
    excerpt:
      'A collection of practical TypeScript patterns that will level up your code.',
    tags: ['typescript', 'javascript', 'tips'],
    publishedAt: '2024-06-01T00:00:00Z',
    formattedDate: 'June 1, 2024',
    children: (
      <PostCard.Title>
        <a href="/posts/typescript-tips">TypeScript Tips for 2024</a>
      </PostCard.Title>
    ),
  },
};
