import { BRAND_VARIANT, HERO_VARIANT, ICONS, SIZE } from '@blog/config';
import { Icon } from '@blog/ui/atoms/icon';
import { NavLink } from '@blog/ui/atoms/nav-link';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ctaActionsDemo } from '@web/testing/modules/cta/fixtures';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { HeroProfileModuleView } from './hero-profile-module-view';

const socialLinksNode = (
  <>
    <li>
      <NavLink
        href="https://github.com/janedoe"
        icon={<Icon name={ICONS.GITHUB} size={SIZE.SM} />}
        hasLabel={false}
      >
        GitHub profile
      </NavLink>
    </li>
    <li>
      <NavLink
        href="https://linkedin.com/in/janedoe"
        icon={<Icon name={ICONS.LINKEDIN} size={SIZE.SM} />}
        hasLabel={false}
      >
        LinkedIn profile
      </NavLink>
    </li>
  </>
);

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
    eyebrow: 'Senior frontend engineer',
    headingBlock: makeHeadingBlock({
      heading: 'Jane Doe',
      supportingText:
        'Architecture, performance, and design systems — from fintech and retail.',
    }),
    sanityImage: makeSanityImage(),
    socialLinksNode,
    socialLinksAriaLabel: 'Profiles',
    ctaButtons: ctaActionsDemo.slice(0, 1),
    contentPosition: undefined,
    contentAlignment: undefined,
    mediaOrder: undefined,
    layout: undefined,
  },
} satisfies Meta<typeof HeroProfileModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const NoSocialLinks: TStory = {
  args: {
    socialLinksNode: null,
  },
};

export const NoActions: TStory = {
  args: {
    ctaButtons: [],
  },
};

export const Split: TStory = {
  args: {
    variant: HERO_VARIANT.SPLIT,
  },
};

export const Banner: TStory = {
  args: {
    variant: HERO_VARIANT.BANNER,
    ctaButtons: ctaActionsDemo,
  },
};
