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
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { MOCK_OUTLINED_BRAND_TINT_SECTION } from '@web/testing/shared/section-appearance/fixtures';

import { PostRelatedModuleView } from './post-related-module-view';

const meta = {
  title: 'Modules/PostRelatedModule',
  component: PostRelatedModuleView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: postCardsArgTypes,
  args: {
    section: { brandVariant: BRAND_VARIANT.PRIMARY, layout: undefined },
    headingBlock: mockHeadingBlock({ heading: 'Related reading' }),
    items: MOCK_POST_CARD_ITEMS,
    contentAlignment: undefined,
    titleId: 'related-posts-title',
    dataTestId: 'post-related-module-post-related-1',
    displayMode: DISPLAY_MODE.GRID,
  },
} satisfies Meta<typeof PostRelatedModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const Secondary: TStory = {
  args: { section: { brandVariant: BRAND_VARIANT.SECONDARY } },
};

export const FourColumns: TStory = {
  args: { columns: GRID_COLUMNS.FOUR },
};

export const Carousel: TStory = {
  args: { displayMode: DISPLAY_MODE.CAROUSEL },
};

export const OutlinedOnBrandTint: TStory = {
  args: { section: MOCK_OUTLINED_BRAND_TINT_SECTION },
};

export const CarouselOutlinedOnBrandTint: TStory = {
  args: {
    displayMode: DISPLAY_MODE.CAROUSEL,
    section: MOCK_OUTLINED_BRAND_TINT_SECTION,
  },
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
