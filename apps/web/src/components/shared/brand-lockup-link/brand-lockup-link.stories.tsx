import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { BrandLockupLink } from './brand-lockup-link';

const meta = {
  title: 'Components/BrandLockupLink',
  component: BrandLockupLink,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { logoUrl: undefined, tagline: 'engineering journal' },
} satisfies Meta<typeof BrandLockupLink>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

/** No `tagline` — the mark renders alone, with no monospace line beneath it. */
export const NoTagline: TStory = {
  args: { tagline: undefined },
};
