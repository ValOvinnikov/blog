import type { Meta, StoryObj } from '@storybook/react';

import { PostCard } from './post-card';

const meta: Meta<typeof PostCard> = {
  title: 'Molecules/PostCard',
  component: PostCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};
export default meta;

type TStory = StoryObj<typeof PostCard>;

export const Full: TStory = {
  args: {
    excerpt:
      'A step-by-step guide to building a scalable, token-driven design system using Tailwind CSS, tailwind-variants, and Atomic Design principles.',
    publishedAt: '2024-03-10T09:00:00Z',
    tags: ['design-system', 'tailwind', 'react'],
    authorName: 'Jane Doe',
    authorAvatarSrc: 'https://i.pravatar.cc/150?img=1',
  },
  render: (args) => (
    <PostCard {...args}>
      <PostCard.Media>
        <img
          src="https://picsum.photos/seed/designsystem/800/450"
          alt="Abstract design elements on a dark background"
        />
      </PostCard.Media>
      <PostCard.Title href="/posts/building-a-design-system">
        Building a Design System from Scratch
      </PostCard.Title>
    </PostCard>
  ),
};

export const Minimal: TStory = {
  render: () => (
    <PostCard>
      <PostCard.Title href="/posts/minimal">A Minimal Post</PostCard.Title>
    </PostCard>
  ),
};

export const WithTags: TStory = {
  args: {
    excerpt:
      'A collection of practical TypeScript patterns that will level up your code.',
    tags: ['typescript', 'javascript', 'tips'],
    publishedAt: '2024-06-01T00:00:00Z',
  },
  render: (args) => (
    <PostCard {...args}>
      <PostCard.Title href="/posts/typescript-tips">
        TypeScript Tips for 2024
      </PostCard.Title>
    </PostCard>
  ),
};
