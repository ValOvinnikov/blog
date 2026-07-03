import type { Meta, StoryObj } from '@storybook/react';
import { Size } from '@blog/config';

import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  tags: ['autodocs'],
};
export default meta;

type TStory = StoryObj<typeof Button>;

export const Default: TStory = {
  args: { children: 'Button', variant: 'primary', size: Size.MD },
};

export const Secondary: TStory = {
  args: { children: 'Button', variant: 'secondary' },
};

export const Ghost: TStory = {
  args: { children: 'Button', variant: 'ghost' },
};

export const Small: TStory = {
  args: { children: 'Button', size: Size.SM },
};

export const Large: TStory = {
  args: { children: 'Button', size: Size.LG },
};

export const Disabled: TStory = {
  args: { children: 'Button', disabled: true },
};
