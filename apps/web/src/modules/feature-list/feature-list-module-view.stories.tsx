import {
  BRAND_VARIANT,
  CARD_IMAGE_SHAPE,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
  ICONS,
} from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ctaActionsDemo } from '@web/testing/modules/cta/fixtures';
import { makeFeatureListItem } from '@web/testing/modules/feature-list/fixtures';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { FeatureListModuleView } from './feature-list-module-view';

const items = [
  makeFeatureListItem({
    id: 'feature-1',
    headingBlock: makeHeadingBlock({
      heading: 'Ship faster',
      supportingText:
        'Every page ships pre-rendered, with ISR keeping content fresh.',
    }),
    icon: ICONS.ZAP,
    link: {
      label: 'Learn more',
      href: '/features/speed',
      target: undefined,
      platform: undefined,
      ariaLabel: undefined,
    },
  }),
  makeFeatureListItem({
    id: 'feature-2',
    headingBlock: makeHeadingBlock({
      heading: 'Built for scale',
      supportingText: 'Multi-tenant from the ground up.',
    }),
    icon: ICONS.LAYERS,
  }),
  makeFeatureListItem({
    id: 'feature-3',
    headingBlock: makeHeadingBlock({
      heading: 'Secure by default',
      supportingText: 'Every tenant is isolated at the data layer.',
    }),
    icon: ICONS.SHIELD_CHECK,
  }),
];

const meta = {
  title: 'Modules/FeatureListModule',
  component: FeatureListModuleView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    brandVariant: {
      control: 'select',
      options: Object.values(BRAND_VARIANT),
    },
    contentAlignment: {
      control: 'select',
      options: Object.values(CONTENT_ALIGNMENT),
    },
    cardAlignment: {
      control: 'select',
      options: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.CENTER],
    },
    displayMode: {
      control: 'select',
      options: Object.values(DISPLAY_MODE),
    },
    imageShape: {
      control: 'select',
      options: Object.values(CARD_IMAGE_SHAPE),
    },
  },
  args: {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: makeHeadingBlock({ heading: 'Why teams choose us' }),
    items,
    ctaButtons: [],
    imageShape: CARD_IMAGE_SHAPE.WIDE,
    displayMode: DISPLAY_MODE.GRID,
    contentAlignment: undefined,
    cardAlignment: CONTENT_ALIGNMENT.LEFT,
    layout: undefined,
    titleId: 'feature-list-title',
    dataTestId: 'feature-list-module-feature-list-1',
  },
} satisfies Meta<typeof FeatureListModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

/** Icon-only cards, the default when no card carries an uploaded image. */
export const Default: TStory = {};

export const WithImages: TStory = {
  args: {
    items: items.map((item) => ({
      ...item,
      sanityImage: makeSanityImage(),
    })),
  },
};

export const SquareImages: TStory = {
  args: {
    imageShape: CARD_IMAGE_SHAPE.SQUARE,
    items: items.map((item) => ({
      ...item,
      sanityImage: makeSanityImage(),
    })),
  },
};

export const CircleImages: TStory = {
  args: {
    imageShape: CARD_IMAGE_SHAPE.CIRCLE,
    items: items.map((item) => ({
      ...item,
      sanityImage: makeSanityImage(),
    })),
  },
};

export const Carousel: TStory = {
  args: { displayMode: DISPLAY_MODE.CAROUSEL },
};

export const WithActions: TStory = {
  args: { ctaButtons: ctaActionsDemo },
};

export const CenterAligned: TStory = {
  args: {
    contentAlignment: CONTENT_ALIGNMENT.CENTER,
    cardAlignment: CONTENT_ALIGNMENT.CENTER,
  },
};

export const FiveCards: TStory = {
  args: {
    items: [
      ...items,
      makeFeatureListItem({ id: 'feature-4', icon: ICONS.ROCKET }),
      makeFeatureListItem({ id: 'feature-5', icon: ICONS.STAR }),
    ],
  },
};
