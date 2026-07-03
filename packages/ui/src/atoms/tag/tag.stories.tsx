import { Size } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/react';

import { Tag } from './tag';

const meta: Meta<typeof Tag> = {
  title: 'Atoms/Tag',
  component: Tag,
  tags: ['autodocs'],
};
export default meta;

type TStory = StoryObj<typeof Tag>;

export const Default: TStory = {
  args: { children: 'Tag', variant: 'default', size: Size.MD },
};

export const Accent: TStory = {
  args: { children: 'Tag', variant: 'accent' },
};

export const Small: TStory = {
  args: { children: 'Tag', size: Size.SM },
};

export const AccentSmall: TStory = {
  args: { children: 'Tag', variant: 'accent', size: Size.SM },
};
