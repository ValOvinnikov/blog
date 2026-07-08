import type { Meta, StoryObj } from '@storybook/react';

import { Caption } from './caption';

const meta: Meta<typeof Caption> = {
  title: 'Atoms/Caption',
  component: Caption,
  tags: ['autodocs'],
};
export default meta;

type TStory = StoryObj<typeof Caption>;

export const Default: TStory = {
  args: { children: 'Photo by Jane Doe on Unsplash' },
};

export const WithClassName: TStory = {
  args: {
    children: 'A longer caption that describes the image in more detail.',
    className: 'max-w-prose',
  },
};
