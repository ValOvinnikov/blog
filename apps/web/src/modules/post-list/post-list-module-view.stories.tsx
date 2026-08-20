import { BRAND_VARIANT } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { makePostListItem } from '@web/testing/modules/post-list/fixtures';

import { PostListModuleView } from './post-list-module-view';

const items = [
  makePostListItem({
    id: 'post-1',
    href: '/blog/building-a-design-system',
    title: 'Building a Design System from Scratch',
    excerpt:
      'A step-by-step guide to building a scalable, token-driven design system using Tailwind CSS.',
    category: { title: 'Design systems' },
  }),
  makePostListItem({
    id: 'post-2',
    href: '/blog/typescript-tips',
    title: 'TypeScript Tips for 2026',
    excerpt: 'A collection of practical TypeScript patterns.',
    category: { title: 'TypeScript' },
  }),
];

const meta = {
  title: 'Modules/PostListModule',
  component: PostListModuleView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    id: 'post-list-1',
    brandVariant: BRAND_VARIANT.PRIMARY,
    sectionHeader: {
      heading: 'Latest posts',
      supportingText: undefined,
      align: undefined,
    },
    items,
    layout: undefined,
  },
} satisfies Meta<typeof PostListModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithoutCmsHeading: TStory = {
  args: {
    sectionHeader: {
      heading: undefined,
      supportingText: undefined,
      align: undefined,
    },
  },
};

export const BrandSecondary: TStory = {
  args: { brandVariant: BRAND_VARIANT.SECONDARY },
};
