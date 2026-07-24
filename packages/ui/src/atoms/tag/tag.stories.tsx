import { objectKeys } from '@blog/utils';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Tag } from './tag';
import { tagVariants } from './tag-variants';

const meta: Meta<typeof Tag> = {
  title: 'Atoms/Tag',
  component: Tag,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: objectKeys(tagVariants.variants.variant),
    },
  },
};
export default meta;

type TStory = StoryObj<typeof Tag>;

export const Default: TStory = {
  args: { children: 'react', variant: 'default' },
};

export const Accent: TStory = {
  args: { children: 'architecture', variant: 'accent' },
};

export const AsLink: TStory = {
  args: {
    children: 'architecture',
    variant: 'accent',
    as: 'a',
    href: '/category/architecture',
  },
};
