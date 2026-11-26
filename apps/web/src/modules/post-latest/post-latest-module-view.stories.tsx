import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
  GRID_COLUMNS,
} from '@shinefold/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  MOCK_POST_CARD_ITEMS,
  mockWithPlaceholderImage,
  postCardsArgTypes,
} from '@web/testing/modules/post-cards/fixtures';
import { mockPostListItem } from '@web/testing/modules/post-list/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { MOCK_OUTLINED_BRAND_TINT_SECTION } from '@web/testing/shared/section-appearance/fixtures';

import { PostLatestModuleView } from './post-latest-module-view';

const meta = {
  title: 'Modules/PostLatestModule',
  component: PostLatestModuleView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: postCardsArgTypes,
  args: {
    section: { brandVariant: BRAND_VARIANT.PRIMARY, layout: undefined },
    headingBlock: mockHeadingBlock({ heading: 'Latest posts' }),
    items: MOCK_POST_CARD_ITEMS,
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

export const WithImages: TStory = {
  args: {
    hasImages: true,
    items: MOCK_POST_CARD_ITEMS.map(mockWithPlaceholderImage),
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
