import type { Meta, StoryObj } from '@storybook/react';

import { Logo } from './logo';

const meta: Meta<typeof Logo> = {
  title: 'Atoms/Logo',
  component: Logo,
  tags: ['autodocs'],
};
export default meta;

type TStory = StoryObj<typeof Logo>;

export const Default: TStory = {
  args: { prefix: 'Val.' },
};

export const WithSuffix: TStory = {
  args: { prefix: 'Val.', suffix: 'dev' },
};
