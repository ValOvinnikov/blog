import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { BrandLockupLink } from './brand-lockup-link';

const meta = {
  title: 'Components/BrandLockupLink',
  component: BrandLockupLink,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    logoUrl: undefined,
    siteName: 'Field Notes',
    tagline: 'engineering journal',
  },
} satisfies Meta<typeof BrandLockupLink>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const NoTagline: TStory = {
  args: { tagline: undefined },
};
