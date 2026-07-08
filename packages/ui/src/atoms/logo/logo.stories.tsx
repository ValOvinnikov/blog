import type { Meta, StoryObj } from '@storybook/react';

import { Logo } from './logo';

const meta = {
  title: 'Atoms/Logo',
  component: Logo,
  tags: ['autodocs'],
  args: { prefix: 'Val.' },
} satisfies Meta<typeof Logo>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithSuffix: TStory = {
  args: { suffix: 'dev' },
};
