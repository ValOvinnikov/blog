import { MOCK_SITE_NAME } from '@blog/ui/testing/fixtures';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { BrandLockup } from './brand-lockup';

const MOCK_WIDE_SRC = 'https://placehold.co/320x64';
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

// Narrow-viewport exception (`ui-storybook` skill) — same as `PrimaryNavigation`'s mobile stories.
export const NarrowViewport: TStory = {
  globals: { viewport: 'phone' },
};

// Below `md` the tagline is hidden, so the mark must render with the same
// sizing as the no-tagline case — regression coverage for the mobile
// stacked-sizing bug.
export const NarrowViewportWithWideImageSourceAndTagline: TStory = {
  globals: { viewport: 'phone' },
  args: {
    src: MOCK_WIDE_SRC,
    tagline: MOCK_TAGLINE,
  },
};
