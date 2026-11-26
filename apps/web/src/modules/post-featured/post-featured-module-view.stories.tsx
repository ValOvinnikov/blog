import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
} from '@shinefold/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  MOCK_DESIGN_SYSTEM_POST_ITEM,
  MOCK_TYPESCRIPT_POST_ITEM,
  mockWithPlaceholderImage,
  postCardsArgTypes,
} from '@web/testing/modules/post-cards/fixtures';
import { mockPostListItem } from '@web/testing/modules/post-list/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { MOCK_OUTLINED_BRAND_TINT_SECTION } from '@web/testing/shared/section-appearance/fixtures';

import { PostFeaturedModuleView } from './post-featured-module-view';

const thirdItem = mockPostListItem({
  id: 'post-3',
  href: '/blog/accessible-forms',
  title: 'Designing Accessible Forms',
  excerpt: 'Patterns for forms that work for everyone.',
  topic: { title: 'Accessibility' },
});

const meta = {
  title: 'Modules/PostFeaturedModule',
  component: PostFeaturedModuleView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    contentAlignment: postCardsArgTypes.contentAlignment,
    displayMode: postCardsArgTypes.displayMode,
  },
  args: {
    section: { brandVariant: BRAND_VARIANT.PRIMARY, layout: undefined },
    headingBlock: mockHeadingBlock({ heading: 'Featured' }),
    items: [MOCK_DESIGN_SYSTEM_POST_ITEM, MOCK_TYPESCRIPT_POST_ITEM, thirdItem],
    contentAlignment: undefined,
    titleId: 'featured-posts-title',
    dataTestId: 'post-featured-module-featured-1',
    displayMode: DISPLAY_MODE.GRID,
  },
} satisfies Meta<typeof PostFeaturedModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const LeadWithSingleTail: TStory = {
  args: {
    hasImages: true,
    items: [MOCK_DESIGN_SYSTEM_POST_ITEM, MOCK_TYPESCRIPT_POST_ITEM].map(
      mockWithPlaceholderImage,
    ),
  },
};

export const LeadOnly: TStory = {
  args: {
    hasImages: true,
    items: [MOCK_DESIGN_SYSTEM_POST_ITEM].map(mockWithPlaceholderImage),
  },
};

export const Secondary: TStory = {
  args: { section: { brandVariant: BRAND_VARIANT.SECONDARY } },
};

export const OutlinedOnBrandTint: TStory = {
  args: { section: MOCK_OUTLINED_BRAND_TINT_SECTION },
};

export const LeadWithSingleTailOutlinedOnBrandTint: TStory = {
  args: {
    items: [MOCK_DESIGN_SYSTEM_POST_ITEM, MOCK_TYPESCRIPT_POST_ITEM],
    section: MOCK_OUTLINED_BRAND_TINT_SECTION,
  },
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

export const CarouselFitsLeft: TStory = {
  args: {
    displayMode: DISPLAY_MODE.CAROUSEL,
    contentAlignment: CONTENT_ALIGNMENT.LEFT,
    items: [MOCK_DESIGN_SYSTEM_POST_ITEM, MOCK_TYPESCRIPT_POST_ITEM],
  },
};

export const CarouselFitsCenter: TStory = {
  args: {
    displayMode: DISPLAY_MODE.CAROUSEL,
    contentAlignment: CONTENT_ALIGNMENT.CENTER,
    items: [MOCK_DESIGN_SYSTEM_POST_ITEM, MOCK_TYPESCRIPT_POST_ITEM],
  },
};

export const PhoneCarouselOverflowsCenter: TStory = {
  globals: { viewport: 'mobile' },
  args: {
    displayMode: DISPLAY_MODE.CAROUSEL,
    contentAlignment: CONTENT_ALIGNMENT.CENTER,
  },
};

export const WithImages: TStory = {
  args: {
    hasImages: true,
    items: [
      MOCK_DESIGN_SYSTEM_POST_ITEM,
      MOCK_TYPESCRIPT_POST_ITEM,
      thirdItem,
    ].map(mockWithPlaceholderImage),
  },
};
