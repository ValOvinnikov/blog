import { TEXT_ROLE } from '@shinefold/config';
import { objectKeys } from '@shinefold/utils/primitives';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Text } from './text';
import { textVariants } from './text-variants';

const meta = {
  title: 'Atoms/Text',
  component: Text,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: objectKeys(textVariants.variants.variant),
    },
    textRole: {
      control: 'select',
      options: Object.values(TEXT_ROLE),
    },
  },
} satisfies Meta<typeof Text>;
export default meta;

type TStory = StoryObj<typeof meta>;

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

export const Footnote: TStory = {
  args: {
    variant: 'footnote',
    children: 'A shared footnote style for module type, rendered subtle.',
  },
};

export const Intro: TStory = {
  args: {
    textRole: TEXT_ROLE.INTRO,
    children:
      'An intro beneath a heading, read through the typography registry.',
  },
};
