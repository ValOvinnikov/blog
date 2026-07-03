import type { Meta, StoryObj } from '@storybook/react';

import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  tags: ['autodocs'],
};
export default meta;

type TStory = StoryObj<typeof Button>;

export const Default: TStory = {
  args: { children: 'Button', variant: 'primary', size: 'md' },
};

export const Secondary: TStory = {
  args: { children: 'Button', variant: 'secondary' },
};

export const Ghost: TStory = {
  args: { children: 'Button', variant: 'ghost' },
};

export const Small: TStory = {
  args: { children: 'Button', size: 'sm' },
};

export const Large: TStory = {
  args: { children: 'Button', size: 'lg' },
};

export const Disabled: TStory = {
  args: { children: 'Button', disabled: true },
};
