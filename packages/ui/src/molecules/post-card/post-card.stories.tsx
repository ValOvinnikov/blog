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
    title: 'Building a Design System from Scratch',
    href: '/posts/building-a-design-system',
    excerpt:
      'A step-by-step guide to building a scalable, token-driven design system using Tailwind CSS, tailwind-variants, and Atomic Design principles.',
    publishedAt: '2024-03-10T09:00:00Z',
    tags: ['design-system', 'tailwind', 'react'],
    coverImage: {
      src: 'https://picsum.photos/seed/designsystem/800/450',
      alt: 'Abstract design elements on a dark background',
    },
    authorName: 'Jane Doe',
    authorAvatarSrc: 'https://i.pravatar.cc/150?img=1',
  },
};

export const Minimal: TStory = {
  args: {
    title: 'A Minimal Post',
    href: '/posts/minimal',
  },
};

export const WithTags: TStory = {
  args: {
    title: 'TypeScript Tips for 2024',
    href: '/posts/typescript-tips',
    excerpt:
      'A collection of practical TypeScript patterns that will level up your code.',
    tags: ['typescript', 'javascript', 'tips'],
    publishedAt: '2024-06-01T00:00:00Z',
  },
};
