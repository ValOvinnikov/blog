import {
  BRAND_VARIANT,
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
  HERO_VARIANT,
} from '@blog/config';
import type { THeroBlogModule } from '@blog/service';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import { mockHeroBlogData } from '@web/testing/modules/hero-blog/fixtures';
import { mockHeroPresentation } from '@web/testing/shared/hero-presentation/fixtures';

import { HeroBlogModuleView } from './hero-blog-module-view';

const primaryButton = {
  variant: CTA_ACTION_VARIANT.PRIMARY,
  appearance: CTA_ACTION_APPEARANCE.CONTAINED,
  link: {
    label: 'Read the post',
    href: '/blog/building-a-design-system',
    target: undefined,
    platform: undefined,
  },
};

const secondaryButton = {
  variant: CTA_ACTION_VARIANT.SECONDARY,
  appearance: CTA_ACTION_APPEARANCE.CONTAINED,
  link: {
    label: 'View all posts',
    href: '/blog',
    target: undefined,
    platform: undefined,
  },
};

const storyModule = (
  overrides: Partial<Extract<THeroBlogModule, { hasPost: true }>> = {},
) =>
  mockHeroBlogData({
    brandVariant: BRAND_VARIANT.BRAND_PRIMARY,
    eyebrow: 'Engineering',
    heading: 'Building a Design System from Scratch',
    supportingText:
      'A deep dive into Atomic Design principles, Tailwind CSS v4, and class-variance-authority — all working together in a portable component library.',
    sanityImage: mockSanityImage(),
    ctaButtons: [primaryButton],
    ...overrides,
  });

const meta = {
  title: 'Modules/HeroBlogModule',
  component: HeroBlogModuleView,
  tags: ['autodocs'],
  args: {
    id: 'hero-blog-1',
    module: storyModule(),
  },
} satisfies Meta<typeof HeroBlogModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const InlinePrimaryAction: TStory = {
  args: {
    module: storyModule({
      ctaButtons: [
        {
          ...primaryButton,
          appearance: CTA_ACTION_APPEARANCE.INLINE,
        },
      ],
    }),
  },
};

export const WithSecondaryAction: TStory = {
  args: {
    module: storyModule({
      ctaButtons: [primaryButton, secondaryButton],
    }),
  },
};

export const Stacked: TStory = {
  args: {
    module: storyModule({
      presentation: mockHeroPresentation({ variant: HERO_VARIANT.STACKED }),
    }),
  },
};

export const Banner: TStory = {
  args: {
    module: storyModule({
      presentation: mockHeroPresentation({ variant: HERO_VARIANT.BANNER }),
    }),
  },
};
