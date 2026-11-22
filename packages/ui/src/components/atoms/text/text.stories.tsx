import { TEXT_ROLE } from '@shinefold/config';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Text } from './text';

const meta = {
  title: 'Atoms/Text',
  component: Text,
  tags: ['autodocs'],
  argTypes: {
    textRole: {
      control: 'select',
      options: Object.values(TEXT_ROLE),
    },
  },
} satisfies Meta<typeof Text>;
export default meta;

type TStory = StoryObj<typeof meta>;

export const Body: TStory = {
  args: {
    children: 'Body text, the look a Text takes when it names no role.',
  },
};

export const Intro: TStory = {
  args: {
    textRole: TEXT_ROLE.INTRO,
    children: 'An intro beneath a page or module title.',
  },
};

export const CardBody: TStory = {
  args: {
    textRole: TEXT_ROLE.CARD_BODY,
    children: 'A card excerpt or description.',
  },
};

export const MetaRole: TStory = {
  args: {
    textRole: TEXT_ROLE.META,
    children: 'A small metadata line.',
  },
};

export const Footnote: TStory = {
  args: {
    textRole: TEXT_ROLE.FOOTNOTE,
    children: 'A footnote beneath a module.',
  },
};
