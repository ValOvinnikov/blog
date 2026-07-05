import { Size } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/react';

import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  tags: ['autodocs'],
};
export default meta;

type TStory = StoryObj<typeof Button>;

export const Primary: TStory = {
  args: { children: 'Publish', variant: 'primary', size: Size.MD },
};

export const Ghost: TStory = {
  args: { children: 'Cancel', variant: 'ghost' },
};

export const Link: TStory = {
  args: { children: 'Read more', variant: 'link' },
};

export const Small: TStory = {
  args: { children: 'Tag', size: Size.SM },
};

export const Large: TStory = {
  args: { children: 'Get started', size: Size.LG },
};

export const Disabled: TStory = {
  args: { children: 'Disabled', disabled: true },
};
