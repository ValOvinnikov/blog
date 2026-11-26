import { ButtonShapes } from '@shinefold/ui/testing/button-shapes';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { keys } from 'remeda';

import { Tag } from './tag';
import { tagVariants } from './tag-variants';

const meta: Meta<typeof Tag> = {
  title: 'Atoms/Tag',
  component: Tag,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: keys(tagVariants.variants.variant),
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
    href: '/topics/architecture',
  },
};

export const ButtonShapesRow: TStory = {
  name: 'Button shapes',
  render: () => (
    <ButtonShapes>
      {() => (
        <>
          <Tag variant="default">react</Tag>
          <Tag variant="accent">architecture</Tag>
        </>
      )}
    </ButtonShapes>
  ),
};
