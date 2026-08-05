import type { Meta, StoryObj } from '@storybook/react-vite';

import { BookmarkToggle } from './bookmark-toggle';

const meta = {
  title: 'Atoms/BookmarkToggle',
  component: BookmarkToggle,
  tags: ['autodocs'],
  args: {
    isBookmarked: false,
    label: 'save',
    ariaLabel: 'Save post',
    onToggle: () => {},
  },
} satisfies Meta<typeof BookmarkToggle>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const NotBookmarked: TStory = {};

export const Bookmarked: TStory = {
  args: { isBookmarked: true, label: 'saved', ariaLabel: 'Remove bookmark' },
};

export const Disabled: TStory = {
  args: { disabled: true },
};
