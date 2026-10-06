import { BRAND_VARIANT, CONTENT_ALIGNMENT, DISPLAY_MODE } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ctaActionsDemo } from '@web/testing/modules/cta/fixtures';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
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

const manyLogos = [
  ...logos,
  makeLogoItem({ id: 'logo-6', name: 'Solstice Partners' }),
  makeLogoItem({ id: 'logo-7', name: 'Vantage Point' }),
];

const overflowingLogos = [
  ...manyLogos,
  makeLogoItem({ id: 'logo-8', name: 'Northwind Traders' }),
  makeLogoItem({ id: 'logo-9', name: 'Beacon Analytics' }),
  makeLogoItem({ id: 'logo-10', name: 'Crestline Media' }),
  makeLogoItem({ id: 'logo-11', name: 'Harborlight Group' }),
  makeLogoItem({ id: 'logo-12', name: 'Fernbridge Co' }),
];

const logosWithDarkLogo = logos.map((logo, index) =>
  index % 2 === 0
    ? {
        ...logo,
        imageDark: makeSanityImage({
          assetId:
            'image-9b1d3f0c2e7a4b5c8d6e1f2a3b4c5d6e7f8a9b0c-1800x400-png',
          alt: logo.name,
          dimensions: { width: 1800, height: 400, aspectRatio: 1800 / 400 },
        }),
      }
    : logo,
);

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
      options: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.CENTER],
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

export const CarouselCenterAligned: TStory = {
  args: {
    displayMode: DISPLAY_MODE.CAROUSEL,
    contentAlignment: CONTENT_ALIGNMENT.CENTER,
  },
};

export const CarouselOverflowing: TStory = {
  args: { displayMode: DISPLAY_MODE.CAROUSEL, logos: overflowingLogos },
};

export const CarouselOverflowingCenterAligned: TStory = {
  args: {
    displayMode: DISPLAY_MODE.CAROUSEL,
    logos: overflowingLogos,
    contentAlignment: CONTENT_ALIGNMENT.CENTER,
  },
};

export const WithActions: TStory = {
  args: { ctaButtons: ctaActionsDemo },
};

export const CenterAligned: TStory = {
  args: { contentAlignment: CONTENT_ALIGNMENT.CENTER },
};

export const SingleLogo: TStory = {
  args: { logos: [logos[0]!] },
};

export const PartialTrailingRow: TStory = {
  args: { logos: manyLogos },
};

const linkedLogos = logos.map((logo) => ({
  ...logo,
  link: {
    label: `Visit ${logo.name}`,
    href: `https://example.com/${logo.id}`,
    target: undefined,
    platform: undefined,
    ariaLabel: undefined,
  },
}));

export const AllLinked: TStory = {
  args: { logos: linkedLogos },
};

export const WithDarkLogos: TStory = {
  args: { logos: logosWithDarkLogo },
};

export const WithDarkLogosInDarkMode: TStory = {
  args: { logos: logosWithDarkLogo },
  decorators: [
    (Story) => (
      <div className="dark bg-primary">
        <Story />
      </div>
    ),
  ],
};

export const CarouselWithDarkLogosInDarkMode: TStory = {
  args: { displayMode: DISPLAY_MODE.CAROUSEL, logos: logosWithDarkLogo },
  decorators: WithDarkLogosInDarkMode.decorators,
};
