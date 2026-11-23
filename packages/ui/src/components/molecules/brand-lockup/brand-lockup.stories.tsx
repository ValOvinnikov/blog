import { MOCK_SITE_NAME } from '@shinefold/ui/testing/fixtures';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { BrandLockup, type TBrandLockupProps } from './brand-lockup';

const MOCK_WIDE_SRC = 'https://placehold.co/320x64';
const MOCK_WIDE_DARK_SRC = 'https://placehold.co/320x64/111111/ffffff';
const MOCK_TAGLINE = 'v1.0.0 · build/local';

const meta = {
  title: 'Molecules/BrandLockup',
  component: BrandLockup,
  tags: ['autodocs'],
  args: { siteName: MOCK_SITE_NAME },
} satisfies Meta<typeof BrandLockup>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithImageSource: TStory = {
  args: { src: 'https://placehold.co/64x64' },
};

export const WithWideImageSource: TStory = {
  args: { src: MOCK_WIDE_SRC },
};

export const WithTagline: TStory = {
  args: { tagline: MOCK_TAGLINE },
};

export const WithWideImageSourceAndTagline: TStory = {
  args: {
    src: MOCK_WIDE_SRC,
    tagline: MOCK_TAGLINE,
  },
};

const withDarkLogoArgs = {
  src: MOCK_WIDE_SRC,
  darkSrc: MOCK_WIDE_DARK_SRC,
} satisfies Partial<TBrandLockupProps>;

export const WithDarkLogo: TStory = {
  name: 'With a dark-mode logo — light mode shows the main logo',
  args: withDarkLogoArgs,
};

export const WithDarkLogoInDarkMode: TStory = {
  name: 'With a dark-mode logo — dark mode swaps to it',
  args: withDarkLogoArgs,
  globals: { theme: 'dark' },
};

export const WithoutDarkLogoInDarkMode: TStory = {
  name: 'Without a dark-mode logo — dark mode keeps the main logo',
  args: { src: MOCK_WIDE_SRC },
  globals: { theme: 'dark' },
};

// Narrow-viewport exception (`ui-storybook` skill) — same as `PrimaryNavigation`'s mobile stories.
export const NarrowViewport: TStory = {
  globals: { viewport: 'phone' },
};

export const NarrowViewportWithWideImageSourceAndTagline: TStory = {
  globals: { viewport: 'phone' },
  args: {
    src: MOCK_WIDE_SRC,
    tagline: MOCK_TAGLINE,
  },
};
