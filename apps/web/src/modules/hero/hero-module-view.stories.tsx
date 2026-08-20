import { BRAND_VARIANT } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';

import { HeroModuleView } from './hero-module-view';

const meta = {
  title: 'Modules/HeroModule',
  component: HeroModuleView,
  tags: ['autodocs'],
  args: {
    id: 'hero-1',
    brandVariant: BRAND_VARIANT.PRIMARY,
    eyebrow: 'Architecture',
    title: 'Building a Design System from Scratch',
    subtitle:
      'A deep dive into Atomic Design principles, Tailwind CSS v4, and class-variance-authority — all working together in a portable component library.',
    sanityImage: undefined,
    primaryAction: {
      label: 'Read more',
      href: '/blog/building-a-design-system',
      target: undefined,
      platform: undefined,
      hiddenLabelSuffix: 'Building a Design System from Scratch',
    },
    secondaryAction: undefined,
    layout: undefined,
    projectId: 'demo-project',
    dataset: 'demo-dataset',
  },
} satisfies Meta<typeof HeroModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

/**
 * A custom, already-descriptive label renders with no visually-hidden
 * suffix — `heroHiddenLabelVariants` only appends one for the generic
 * fallback label.
 */
export const CustomCtaLabel: TStory = {
  args: {
    primaryAction: {
      label: 'Explore our latest stories',
      href: '/blog',
      target: undefined,
      platform: undefined,
      hiddenLabelSuffix: undefined,
    },
  },
};

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

/**
 * `SanityImage` bakes a hotspot-aware 16:9 crop into the source URL at
 * render time, rather than relying on CSS `object-fit` alone.
 */
export const WithImage: TStory = {
  args: {
    sanityImage: makeSanityImage(),
  },
};

export const BrandSecondary: TStory = {
  args: {
    brandVariant: BRAND_VARIANT.SECONDARY,
  },
};
