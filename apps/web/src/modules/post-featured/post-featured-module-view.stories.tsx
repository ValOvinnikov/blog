import { BRAND_VARIANT, CONTENT_ALIGNMENT, DISPLAY_MODE } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { makePostListItem } from '@web/testing/modules/post-list/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { PostFeaturedModuleView } from './post-featured-module-view';

const leadItem = makePostListItem({
  id: 'post-1',
  href: '/blog/building-a-design-system',
  title: 'Building a Design System from Scratch',
  excerpt:
    'A step-by-step guide to building a scalable, token-driven design system using Tailwind CSS.',
  topic: { title: 'Design systems' },
});

const secondItem = makePostListItem({
  id: 'post-2',
  href: '/blog/typescript-tips',
  title: 'TypeScript Tips for 2026',
  excerpt: 'A collection of practical TypeScript patterns.',
  topic: { title: 'TypeScript' },
});

const thirdItem = makePostListItem({
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
    brandVariant: {
      control: 'select',
      options: [BRAND_VARIANT.PRIMARY, BRAND_VARIANT.SECONDARY],
    },
    contentAlignment: {
      control: 'select',
      options: Object.values(CONTENT_ALIGNMENT),
    },
    displayMode: {
      control: 'select',
      options: Object.values(DISPLAY_MODE),
    },
  },
  args: {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: makeHeadingBlock({ heading: 'Featured' }),
    items: [leadItem, secondItem, thirdItem],
    layout: undefined,
    contentAlignment: undefined,
    titleId: 'featured-posts-title',
    dataTestId: 'post-featured-module-featured-1',
    accessibleTitle: 'Featured posts',
    displayMode: DISPLAY_MODE.GRID,
  },
} satisfies Meta<typeof PostFeaturedModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

/** One lead card plus a two-column grid of the remaining posts. */
export const Default: TStory = {};

/** One lead card plus exactly one full-width split tail card. */
export const LeadWithSingleTail: TStory = {
  args: { items: [leadItem, secondItem] },
};

/** Only the lead card, no tail posts at all. */
export const LeadOnly: TStory = {
  args: { items: [leadItem] },
};

export const WithoutCmsHeading: TStory = {
  args: {
    headingBlock: makeHeadingBlock(),
  },
};

export const Secondary: TStory = {
  args: { brandVariant: BRAND_VARIANT.SECONDARY },
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
    items: [leadItem, secondItem, thirdItem].map((item) => ({
      ...item,
      image: placeholderImage(item.title),
    })),
  },
};
