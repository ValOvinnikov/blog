import type { Meta, StoryObj } from '@storybook/react';

import { Hero } from './hero';

const meta = {
  title: 'Organisms/Hero',
  component: Hero,
  tags: ['autodocs'],
  args: {
    eyebrow: 'Architecture',
    title: 'Building a Design System from Scratch',
    excerpt:
      'A deep dive into Atomic Design principles, Tailwind CSS v4, and class-variance-authority — all working together in a portable component library.',
    tags: ['Design System', 'Tailwind', 'React'],
    publishedAt: '2024-06-01T00:00:00Z',
    formattedDate: 'June 1, 2024',
    ariaLabel: 'Featured post',
    children: (
      <>
        <Hero.Media>
          <img
            src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=675&fit=crop"
            alt="Code editor showing component code"
          />
        </Hero.Media>
        <Hero.Cta>
          <a href="/posts/design-system">Read more</a>
        </Hero.Cta>
      </>
    ),
  },
} satisfies Meta<typeof Hero>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Full: TStory = {};

export const Minimal: TStory = {
  args: {
    eyebrow: 'Senior frontend engineer',
    title: 'Notes on shipping frontend at scale',
    excerpt:
      'Architecture, performance, and design systems — from fintech and retail. Written, not generated.',
    tags: undefined,
    publishedAt: undefined,
    formattedDate: undefined,
    children: undefined,
  },
};

export const WithoutEyebrow: TStory = {
  args: {
    eyebrow: undefined,
    children: (
      <Hero.Cta>
        <a href="/posts/design-system">Read more</a>
      </Hero.Cta>
    ),
  },
};

export const WithoutImage: TStory = {
  args: {
    children: (
      <Hero.Cta>
        <a href="/posts/design-system">Read more</a>
      </Hero.Cta>
    ),
  },
};

export const WithoutTags: TStory = {
  args: { tags: undefined },
};
