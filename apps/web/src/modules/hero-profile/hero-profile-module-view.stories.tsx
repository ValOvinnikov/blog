import { BRAND_VARIANT, HERO_VARIANT, SOCIAL_PLATFORMS } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ctaActionsDemo } from '@web/testing/modules/cta/fixtures';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import {
  portableTextBlock,
  portableTextSpan,
} from '@web/testing/shared/portable-text/fixtures';

import { HeroProfileModuleView } from './hero-profile-module-view';

const bioDemo = [
  portableTextBlock(
    'Jane has spent the last decade designing developer tools, with a focus on making complex systems feel approachable.',
  ),
  portableTextBlock(
    [
      portableTextSpan('Outside of work, she writes about design systems on '),
      portableTextSpan('her blog', ['link-1']),
      portableTextSpan('.'),
    ],
    {
      markDefs: [
        {
          _type: 'linkRef',
          _key: 'link-1',
          link: { href: 'https://example.com', target: undefined },
        },
      ],
    },
  ),
];

const socialLinks = [
  {
    platform: SOCIAL_PLATFORMS.GITHUB,
    link: {
      label: 'GitHub',
      href: 'https://github.com/example',
      target: '_blank' as const,
      platform: undefined,
      ariaLabel: undefined,
    },
  },
  {
    platform: SOCIAL_PLATFORMS.LINKEDIN,
    link: {
      label: 'LinkedIn',
      href: 'https://linkedin.com/in/example',
      target: '_blank' as const,
      platform: undefined,
      ariaLabel: undefined,
    },
  },
];

const meta = {
  title: 'Modules/HeroProfileModule',
  component: HeroProfileModuleView,
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
    id: 'hero-profile-1',
    brandVariant: BRAND_VARIANT.BRAND_PRIMARY,
    variant: HERO_VARIANT.STACKED,
    eyebrow: 'Product designer',
    headingBlock: makeHeadingBlock({
      heading: "Hi, I'm Jane",
      supportingText:
        'I design and build products for teams who care about craft.',
    }),
    avatarName: 'Jane Cooper',
    sanityImage: makeSanityImage(),
    bio: bioDemo,
    socialLinks,
    ctaButtons: ctaActionsDemo.slice(0, 1),
    contentPosition: undefined,
    contentAlignment: undefined,
    mediaOrder: undefined,
    layout: undefined,
  },
} satisfies Meta<typeof HeroProfileModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Stacked: TStory = {};

export const StackedNoPhoto: TStory = {
  args: {
    sanityImage: undefined,
  },
};

export const Split: TStory = {
  args: {
    variant: HERO_VARIANT.SPLIT,
  },
};

export const SplitNoPhoto: TStory = {
  args: {
    variant: HERO_VARIANT.SPLIT,
    sanityImage: undefined,
  },
};

export const Banner: TStory = {
  args: {
    variant: HERO_VARIANT.BANNER,
    ctaButtons: ctaActionsDemo,
  },
};

export const BannerNoPhoto: TStory = {
  args: {
    variant: HERO_VARIANT.BANNER,
    sanityImage: undefined,
  },
};

export const NoSocialLinks: TStory = {
  args: {
    socialLinks: [],
  },
};

export const NoBio: TStory = {
  args: {
    bio: undefined,
  },
};
