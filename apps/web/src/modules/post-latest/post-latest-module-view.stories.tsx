import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
  GRID_COLUMNS,
} from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { mockPostListItem } from '@web/testing/modules/post-list/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { MOCK_OUTLINED_BRAND_TINT_SECTION } from '@web/testing/shared/section-appearance/fixtures';

import { PostLatestModuleView } from './post-latest-module-view';

const items = [
  mockPostListItem({
    id: 'post-1',
    href: '/blog/building-a-design-system',
    title: 'Building a Design System from Scratch',
    excerpt:
      'A step-by-step guide to building a scalable, token-driven design system using Tailwind CSS.',
    topic: { title: 'Design systems' },
  }),
  mockPostListItem({
    id: 'post-2',
    href: '/blog/typescript-tips',
    title: 'TypeScript Tips for 2026',
    excerpt: 'A collection of practical TypeScript patterns.',
    topic: { title: 'TypeScript' },
  }),
];

const meta = {
  title: 'Modules/PostLatestModule',
  component: PostLatestModuleView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    columns: {
      control: 'select',
      options: [GRID_COLUMNS.TWO, GRID_COLUMNS.THREE, GRID_COLUMNS.FOUR],
    },
    contentAlignment: {
      control: 'select',
      options: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.CENTER],
    },
    displayMode: {
      control: 'select',
      options: Object.values(DISPLAY_MODE),
    },
  },
  args: {
    section: { brandVariant: BRAND_VARIANT.PRIMARY, layout: undefined },
    headingBlock: mockHeadingBlock({ heading: 'Latest posts' }),
    items,
    contentAlignment: undefined,
    titleId: 'latest-posts-title',
    dataTestId: 'post-latest-module-post-latest-1',
    displayMode: DISPLAY_MODE.GRID,
  },
} satisfies Meta<typeof PostLatestModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const Secondary: TStory = {
  args: { section: { brandVariant: BRAND_VARIANT.SECONDARY } },
};

export const TwoColumns: TStory = {
  args: { columns: GRID_COLUMNS.TWO },
};

export const OutlinedOnBrandTint: TStory = {
  args: { section: MOCK_OUTLINED_BRAND_TINT_SECTION },
};

export const CenterAligned: TStory = {
  args: { contentAlignment: CONTENT_ALIGNMENT.CENTER },
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

const carouselItems = Array.from({ length: 6 }, (_, index) =>
  mockPostListItem({
    id: `carousel-post-${index + 1}`,
    href: `/blog/carousel-post-${index + 1}`,
    title: `Carousel post ${index + 1}`,
    excerpt: 'A short excerpt describing this post.',
    topic: { title: 'News' },
  }),
);

export const Carousel: TStory = {
  args: {
    displayMode: DISPLAY_MODE.CAROUSEL,
    items: carouselItems,
  },
};

export const CarouselFitsCenter: TStory = {
  args: {
    displayMode: DISPLAY_MODE.CAROUSEL,
    contentAlignment: CONTENT_ALIGNMENT.CENTER,
    items: carouselItems.slice(0, 2),
  },
};

export const CarouselOutlinedOnBrandTint: TStory = {
  args: {
    displayMode: DISPLAY_MODE.CAROUSEL,
    items: carouselItems,
    section: MOCK_OUTLINED_BRAND_TINT_SECTION,
  },
};

export const FourColumns: TStory = {
  args: { columns: GRID_COLUMNS.FOUR, items: carouselItems.slice(0, 4) },
};
