import { objectKeys } from '@blog/utils/primitives';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Text } from './text';
import { textVariants } from './text-variants';

const meta: Meta<typeof Text> = {
  title: 'Atoms/Text',
  component: Text,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: objectKeys(textVariants.variants.variant),
    },
  },
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

export const Supporting: TStory = {
  args: {
    variant: 'supporting',
    children: 'A muted secondary line supporting a heading or label.',
  },
};

export const Hint: TStory = {
  args: {
    variant: 'hint',
    children: 'A small muted hint or note, smaller than Supporting.',
  },
};

export const Statement: TStory = {
  args: {
    variant: 'statement',
    children: 'A larger, full-color standalone statement of body copy.',
  },
};

export const MetaVariant: TStory = {
  args: {
    variant: 'meta',
    children: 'A small metadata line, rendered in the subtle token color.',
  },
};

export const Emphasis: TStory = {
  args: {
    variant: 'emphasis',
    children: 'Card-sized copy rendered bold and full-color for emphasis.',
  },
};
