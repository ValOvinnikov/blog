import { BRAND_VARIANT, CONTENT_ALIGNMENT } from '@blog/config';
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
    topic: { title: 'Design systems' },
  }),
  makePostListItem({
    id: 'post-2',
    href: '/blog/typescript-tips',
    title: 'TypeScript Tips for 2026',
    excerpt: 'A collection of practical TypeScript patterns.',
    topic: { title: 'TypeScript' },
  }),
];

const meta = {
  title: 'Modules/PostListModule',
  component: PostListModuleView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    brandVariant: {
      control: 'select',
      options: [BRAND_VARIANT.PRIMARY, BRAND_VARIANT.SECONDARY],
    },
    contentAlignment: {
      control: 'select',
      options: Object.values(CONTENT_ALIGNMENT),
    },
  },
  args: {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: {
      heading: 'Latest posts',
      supportingText: undefined,
    },
    items,
    layout: undefined,
    contentAlignment: undefined,
    titleId: 'post-list-title',
    dataTestId: 'post-list-module-post-list-1',
    accessibleTitle: 'Latest posts',
    emptyMessage: 'No posts yet.',
  },
} satisfies Meta<typeof PostListModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithoutCmsHeading: TStory = {
  args: {
    headingBlock: {
      heading: undefined,
      supportingText: undefined,
    },
  },
};

export const Secondary: TStory = {
  args: { brandVariant: BRAND_VARIANT.SECONDARY },
};

export const CenterAligned: TStory = {
  args: { contentAlignment: CONTENT_ALIGNMENT.CENTER },
};

export const Empty: TStory = {
  args: { items: [] },
};

export const WithPagination: TStory = {
  args: {
    pagination: {
      currentPage: 2,
      totalPages: 5,
      createHref: (page: number) => `/blog/page/${page}`,
      ariaLabel: 'Blog pages',
      previousLabel: 'Previous',
      nextLabel: 'Next',
    },
  },
};

const placeholderImage = (alt: string) => (
  // eslint-disable-next-line @next/next/no-img-element -- Storybook placeholder image, not a production asset; next/image would be wrong here
  <img src="https://placehold.co/640x360" alt={alt} />
);

export const WithImages: TStory = {
  args: {
    hasImages: true,
    items: items.map((item) => ({
      ...item,
      image: placeholderImage(item.title),
    })),
  },
};
