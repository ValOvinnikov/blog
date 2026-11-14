import { BRAND_VARIANT, CONTENT_ALIGNMENT, GRID_COLUMNS } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { TopicChipList } from '@web/components/shared/topic-chip-list';
import { mockPostListItem } from '@web/testing/modules/post-list/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { MOCK_OUTLINED_BRAND_TINT_SECTION } from '@web/testing/shared/section-appearance/fixtures';
import {
  MOCK_ENGINEERING_TOPIC,
  MOCK_SECOND_TOPIC,
  MOCK_THIRD_TOPIC,
} from '@web/testing/shared/topic/fixtures';

import { PostListModuleView } from './post-list-module-view';

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

const topics = [MOCK_ENGINEERING_TOPIC, MOCK_SECOND_TOPIC, MOCK_THIRD_TOPIC];

const meta = {
  title: 'Modules/PostListModule',
  component: PostListModuleView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    contentAlignment: {
      control: 'select',
      options: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.CENTER],
    },
  },
  args: {
    section: { brandVariant: BRAND_VARIANT.PRIMARY, layout: undefined },
    grid: { columns: undefined, showImages: false },
    headingBlock: mockHeadingBlock({ heading: 'Latest posts' }),
    items,
    contentAlignment: undefined,
    titleId: 'post-list-title',
    dataTestId: 'post-list-module-post-list-1',
    emptyMessage: 'No posts yet.',
  },
} satisfies Meta<typeof PostListModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const Secondary: TStory = {
  args: { section: { brandVariant: BRAND_VARIANT.SECONDARY } },
};

export const TwoColumns: TStory = {
  args: { grid: { columns: GRID_COLUMNS.TWO, showImages: false } },
};

export const FourColumns: TStory = {
  args: {
    grid: { columns: GRID_COLUMNS.FOUR, showImages: false },
    items: [...items, ...items].map((item, index) => ({
      ...item,
      id: `post-${index + 1}`,
    })),
  },
};

export const OutlinedOnBrandTint: TStory = {
  args: { section: MOCK_OUTLINED_BRAND_TINT_SECTION },
};

export const WithTopicChipsOnBrandTint: TStory = {
  args: {
    section: MOCK_OUTLINED_BRAND_TINT_SECTION,
    children: <TopicChipList topics={topics} />,
  },
};

export const WithTopicChipsCenterAligned: TStory = {
  args: {
    contentAlignment: CONTENT_ALIGNMENT.CENTER,
    children: <TopicChipList topics={topics} />,
  },
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
    grid: { columns: undefined, showImages: true },
    items: items.map((item) => ({
      ...item,
      image: placeholderImage(item.title),
    })),
  },
};
