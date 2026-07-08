import type { Meta, StoryObj } from '@storybook/react';

import { Text } from './text';

const meta: Meta<typeof Text> = {
  title: 'Atoms/Text',
  component: Text,
  tags: ['autodocs'],
};
export default meta;

type TStory = StoryObj<typeof Text>;

export const Lead: TStory = {
  args: {
    variant: 'lead',
    children:
      'Serif body copy in the default lead style — full color, generous line height.',
  },
};

export const Muted: TStory = {
  args: {
    variant: 'muted',
    children: 'Same size as lead but rendered in the muted token color.',
  },
};

export const Hero: TStory = {
  args: {
    variant: 'hero',
    children:
      'Base-size excerpt used beneath the hero heading. Slightly smaller than lead with muted color.',
  },
};

export const Card: TStory = {
  args: {
    variant: 'card',
    children: 'Compact excerpt for post cards with tighter leading.',
  },
};
