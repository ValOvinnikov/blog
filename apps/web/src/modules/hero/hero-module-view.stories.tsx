import { BRAND_VARIANT } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';

import { HeroModuleView } from './hero-module-view';

const meta = {
  title: 'Modules/HeroModule',
  component: HeroModuleView,
  tags: ['autodocs'],
  argTypes: {
    brandVariant: {
      control: 'select',
      options: Object.values(BRAND_VARIANT),
    },
  },
  args: {
    id: 'hero-1',
    brandVariant: BRAND_VARIANT.BRAND_PRIMARY,
    eyebrow: 'Architecture',
    title: 'Building a Design System from Scratch',
    subtitle:
      'A deep dive into Atomic Design principles, Tailwind CSS v4, and class-variance-authority — all working together in a portable component library.',
    // `SanityImage` bakes a hotspot-aware 16:9 crop into the source URL at
    // render time, rather than relying on CSS `object-fit` alone.
    sanityImage: makeSanityImage(),
    primaryAction: {
      label: 'Read more',
      href: '/blog/building-a-design-system',
      target: undefined,
      platform: undefined,
      hiddenLabelSuffix: 'Building a Design System from Scratch',
    },
    secondaryAction: undefined,
    layout: undefined,
  },
} satisfies Meta<typeof HeroModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithSecondaryAction: TStory = {
  args: {
    secondaryAction: {
      label: 'View all posts',
      href: '/blog',
      target: undefined,
      platform: undefined,
      ariaLabel: undefined,
    },
  },
};

export const Primary: TStory = {
  args: {
    brandVariant: BRAND_VARIANT.PRIMARY,
  },
};

export const Secondary: TStory = {
  args: {
    brandVariant: BRAND_VARIANT.SECONDARY,
  },
};
