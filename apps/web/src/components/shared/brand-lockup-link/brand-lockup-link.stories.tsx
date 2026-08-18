import { BRAND_VARIANTS } from '@blog/config';
import type { TBrand } from '@blog/service';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { BrandLockupLink } from './brand-lockup-link';

const brand: TBrand = {
  name: 'Field Notes',
  specLine: 'engineering journal',
  logoUrl: undefined,
  logoAsset: undefined,
  variant: BRAND_VARIANTS.CONSOLE,
};

const meta = {
  title: 'Components/BrandLockupLink',
  component: BrandLockupLink,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { brand },
} satisfies Meta<typeof BrandLockupLink>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

/** No `specLine` — the mark renders alone, with no monospace line beneath it. */
export const NoSpecLine: TStory = {
  args: { brand: { ...brand, specLine: undefined } },
};
