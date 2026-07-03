import type { Meta, StoryObj } from '@storybook/react';

import { Button } from './Button';

const meta = {
  component: Button,
  tags: ['autodocs'],
} satisfies Meta<typeof Button>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {
  args: {
    children: 'Click me',
    variant: 'primary',
    size: 'md',
  },
};

export const Secondary: TStory = {
  args: {
    children: 'Secondary',
    variant: 'secondary',
  },
};

export const Ghost: TStory = {
  args: {
    children: 'Ghost',
    variant: 'ghost',
  },
};

export const Small: TStory = {
  args: {
    children: 'Small button',
    size: 'sm',
  },
};

export const Large: TStory = {
  args: {
    children: 'Large button',
    size: 'lg',
  },
};

export const Disabled: TStory = {
  args: {
    children: 'Disabled',
    disabled: true,
  },
};
