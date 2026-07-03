import type { Meta, StoryObj } from '@storybook/react';

import { Hero } from './hero';

const meta: Meta<typeof Hero> = {
  title: 'Organisms/Hero',
  component: Hero,
  tags: ['autodocs'],
  args: {
    title: 'Building a Design System from Scratch',
    excerpt:
      'A deep dive into Atomic Design principles, Tailwind CSS v4, and class-variance-authority — all working together in a portable component library.',
    href: '/posts/design-system',
    ctaLabel: 'Read more',
    tags: ['Design System', 'Tailwind', 'React'],
    coverImage: {
      src: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=675&fit=crop',
      alt: 'Code editor showing component code',
    },
    publishedAt: '2024-06-01T00:00:00Z',
  },
};
export default meta;

type TStory = StoryObj<typeof Hero>;

export const Full: TStory = {};

export const WithoutImage: TStory = {
  args: {
    coverImage: undefined,
  },
};

export const WithoutTags: TStory = {
  args: {
    tags: undefined,
  },
};
