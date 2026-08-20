import { HEADING_ALIGN } from '@blog/config';
import { objectKeys } from '@blog/utils/primitives';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { PostsSection } from './posts-section';
import { postsSectionVariants } from './posts-section-variants';

const posts = [
  {
    id: '1',
    href: '/posts/building-a-design-system',
    title: 'Building a Design System from Scratch',
    excerpt:
      'A step-by-step guide to building a scalable, token-driven design system using Tailwind CSS.',
    publishedAt: '2024-06-01T00:00:00Z',
    formattedDate: 'June 1, 2024',
    readingTime: '9 min',
    topic: { title: 'design-system' },
  },
  {
    id: '2',
    href: '/posts/typescript-tips',
    title: 'TypeScript Tips for 2025',
    excerpt:
      'A collection of practical TypeScript patterns that will level up your code.',
    publishedAt: '2024-05-15T00:00:00Z',
    formattedDate: 'May 15, 2024',
    readingTime: '5 min',
    topic: { title: 'typescript' },
  },
  {
    id: '3',
    href: '/posts/atomic-design',
    title: 'Atomic Design in Practice',
    excerpt:
      'How to apply Atomic Design principles to a real-world component library.',
    publishedAt: '2024-04-20T00:00:00Z',
    formattedDate: 'April 20, 2024',
    topic: { title: 'atomic-design' },
  },
];

const meta = {
  title: 'Organisms/PostsSection',
  component: PostsSection,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    align: {
      control: 'select',
      options: objectKeys(postsSectionVariants.variants.align),
    },
  },
  args: {
    title: 'Latest',
    titleId: 'latest-posts',
    posts,
  },
} satisfies Meta<typeof PostsSection>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const TwoPosts: TStory = {
  args: {
    posts: posts.slice(0, 2),
  },
};

export const Empty: TStory = {
  args: {
    posts: [],
  },
};

export const EmptyWithMessage: TStory = {
  args: {
    posts: [],
    emptyMessage: 'No posts in this topic yet — check back soon.',
  },
};

export const TintedBand: TStory = {
  args: {
    title: 'Related reading',
    titleId: 'related-posts-title',
    isTinted: true,
  },
  parameters: { layout: 'fullscreen' },
};

export const Wrapped: TStory = {
  args: {
    isWrapped: true,
  },
};

export const WithSupportingText: TStory = {
  args: {
    supportingText:
      'Hand-picked posts on design systems, TypeScript, and component architecture.',
  },
};

export const Centered: TStory = {
  args: {
    align: HEADING_ALIGN.CENTER,
    supportingText:
      'Hand-picked posts on design systems, TypeScript, and component architecture.',
  },
};

export const VisuallyHiddenTitle: TStory = {
  args: {
    title: undefined,
    titleId: 'latest-posts-fallback',
    titleFallback: 'Latest posts',
  },
};

export const NoTitle: TStory = {
  args: {
    title: undefined,
    titleId: undefined,
  },
};
