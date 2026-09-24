import { BRAND_VARIANT, CONTENT_ALIGNMENT, DISPLAY_MODE } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ctaActionsDemo } from '@web/testing/modules/cta/fixtures';
import { makeLogoItem } from '@web/testing/modules/logo-wall/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { LogoWallModuleView } from './logo-wall-module-view';

const logos = [
  makeLogoItem({ id: 'logo-1', name: 'Acme Corp' }),
  makeLogoItem({ id: 'logo-2', name: 'Nimbus Inc' }),
  makeLogoItem({ id: 'logo-3', name: 'Lighthouse Studio' }),
  makeLogoItem({
    id: 'logo-4',
    name: 'Cascade Labs',
    link: {
      label: 'Visit Cascade Labs',
      href: 'https://cascade.example.com',
      target: undefined,
      platform: undefined,
      ariaLabel: undefined,
    },
  }),
  makeLogoItem({ id: 'logo-5', name: 'Meridian Group' }),
];

const meta = {
  title: 'Modules/LogoWallModule',
  component: LogoWallModuleView,
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
    headingBlock: makeHeadingBlock({ heading: 'Trusted by' }),
    logos,
    ctaButtons: [],
    displayMode: DISPLAY_MODE.GRID,
    contentAlignment: undefined,
    layout: undefined,
    titleId: 'logo-wall-title',
    dataTestId: 'logo-wall-module-logo-wall-1',
  },
} satisfies Meta<typeof LogoWallModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Grid: TStory = {};

export const Carousel: TStory = {
  args: { displayMode: DISPLAY_MODE.CAROUSEL },
};

export const WithActions: TStory = {
  args: { ctaButtons: ctaActionsDemo },
};

export const CenterAligned: TStory = {
  args: { contentAlignment: CONTENT_ALIGNMENT.CENTER },
};

export const RightAligned: TStory = {
  args: { contentAlignment: CONTENT_ALIGNMENT.RIGHT },
};

export const SingleLogo: TStory = {
  args: { logos: [logos[0]!] },
};

export const PartialTrailingRow: TStory = {
  args: {
    logos: [
      ...logos,
      makeLogoItem({ id: 'logo-6', name: 'Solstice Partners' }),
      makeLogoItem({ id: 'logo-7', name: 'Vantage Point' }),
    ],
  },
};
