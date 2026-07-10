import { Size } from '@blog/config';
import { objectKeys } from '@blog/utils';
import type { Meta, StoryObj } from '@storybook/react';

import { Heading } from './heading';
import { headingVariants } from './heading-variants';

const meta: Meta<typeof Heading> = {
  title: 'Atoms/Heading',
  component: Heading,
  tags: ['autodocs'],
  argTypes: {
    visual: {
      control: 'select',
      options: objectKeys(headingVariants.variants.visual),
    },
    size: {
      control: 'select',
      options: objectKeys(headingVariants.variants.size),
    },
  },
};
export default meta;

type TStory = StoryObj<typeof Heading>;

export const H1: TStory = {
  args: { level: 1, children: 'Heading Level 1' },
};

export const H2: TStory = {
  args: { level: 2, children: 'Heading Level 2' },
};

export const H3: TStory = {
  args: { level: 3, children: 'Heading Level 3' },
};

export const H4: TStory = {
  args: { level: 4, children: 'Heading Level 4' },
};

export const WithSizeOverride: TStory = {
  args: { level: 2, size: Size.XS, children: 'H2 with xs size override' },
};

export const VisualHero: TStory = {
  args: { level: 1, visual: 'hero', children: 'Hero Heading' },
};

export const VisualPost: TStory = {
  args: { level: 1, visual: 'post', children: 'Post Title Heading' },
};

export const VisualCard: TStory = {
  args: { level: 2, visual: 'card', children: 'Card Title Heading' },
};

export const VisualSection: TStory = {
  args: { level: 2, visual: 'section', children: 'Section Heading' },
};
