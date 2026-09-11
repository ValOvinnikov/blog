import { BRAND_VARIANT, HERO_VARIANT } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ctaActionsDemo } from '@web/testing/modules/cta/fixtures';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';

import { HeroStatementModuleView } from './hero-statement-module-view';

const meta = {
  title: 'Modules/HeroStatementModule',
  component: HeroStatementModuleView,
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
    id: 'hero-statement-1',
    brandVariant: BRAND_VARIANT.BRAND_PRIMARY,
    variant: HERO_VARIANT.SPLIT,
    eyebrow: 'Now shipping',
    heading: 'Build faster, ship sooner',
    supportingText:
      'A marketing hero for a landing or home page — an authored statement rather than a resolved post, with zero, one, or two authored actions.',
    sanityImage: makeSanityImage(),
    actions: ctaActionsDemo.slice(0, 1),
    contentPosition: undefined,
    contentAlignment: undefined,
    mediaOrder: undefined,
    layout: undefined,
  },
} satisfies Meta<typeof HeroStatementModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const NoActions: TStory = {
  args: {
    actions: undefined,
  },
};

export const TwoActions: TStory = {
  args: {
    actions: ctaActionsDemo,
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
    actions: ctaActionsDemo,
  },
};
