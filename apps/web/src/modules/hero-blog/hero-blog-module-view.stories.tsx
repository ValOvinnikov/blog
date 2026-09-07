import {
  BRAND_VARIANT,
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
  HERO_VARIANT,
} from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';

import { HeroBlogModuleView } from './hero-blog-module-view';

const meta = {
  title: 'Modules/HeroBlogModule',
  component: HeroBlogModuleView,
  tags: ['autodocs'],
  argTypes: {
    brandVariant: {
      control: 'select',
      options: Object.values(BRAND_VARIANT),
    },
    variant: {
      control: 'select',
      options: Object.values(HERO_VARIANT),
    },
  },
  args: {
    id: 'hero-blog-1',
    brandVariant: BRAND_VARIANT.BRAND_PRIMARY,
    variant: HERO_VARIANT.SPLIT,
    eyebrow: 'Engineering',
    heading: 'Building a Design System from Scratch',
    supportingText:
      'A deep dive into Atomic Design principles, Tailwind CSS v4, and class-variance-authority — all working together in a portable component library.',
    sanityImage: makeSanityImage(),
    primaryAction: {
      label: 'Read more',
      href: '/blog/building-a-design-system',
      target: undefined,
      platform: undefined,
      hiddenLabelSuffix: 'Building a Design System from Scratch',
      appearance: CTA_ACTION_APPEARANCE.CONTAINED,
    },
    secondaryAction: undefined,
    contentPosition: undefined,
    contentAlignment: undefined,
    mediaOrder: undefined,
    layout: undefined,
  },
} satisfies Meta<typeof HeroBlogModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const InlinePrimaryAction: TStory = {
  args: {
    primaryAction: {
      label: 'Read more',
      href: '/blog/building-a-design-system',
      target: undefined,
      platform: undefined,
      hiddenLabelSuffix: 'Building a Design System from Scratch',
      appearance: CTA_ACTION_APPEARANCE.INLINE,
    },
  },
};

export const WithSecondaryAction: TStory = {
  args: {
    secondaryAction: {
      variant: CTA_ACTION_VARIANT.SECONDARY,
      appearance: CTA_ACTION_APPEARANCE.CONTAINED,
      link: {
        label: 'View all posts',
        href: '/blog',
        target: undefined,
        platform: undefined,
        ariaLabel: undefined,
      },
    },
  },
};

export const Stacked: TStory = {
  args: {
    variant: HERO_VARIANT.STACKED,
  },
};

export const Banner: TStory = {
  args: {
    variant: HERO_VARIANT.BANNER,
  },
};
