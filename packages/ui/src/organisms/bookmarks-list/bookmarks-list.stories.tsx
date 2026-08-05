import type { Meta, StoryObj } from '@storybook/react-vite';

import { BookmarksList } from './bookmarks-list';

const rows = [
  {
    id: '1',
    formattedDate: 'Aug 01',
    filename: 'static-first-rendering.md',
    href: '/blog/static-first-rendering',
  },
  {
    id: '2',
    formattedDate: 'Jul 28',
    filename: 'the-cost-of-a-hydration.md',
    href: '/blog/the-cost-of-a-hydration',
  },
  {
    id: '3',
    formattedDate: 'Jul 19',
    filename: 'oklch-in-anger.md',
    href: '/blog/oklch-in-anger',
  },
];

const meta = {
  title: 'Organisms/BookmarksList',
  component: BookmarksList,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    rows,
    emptyMessage: 'No bookmarks yet — save a post to find it here.',
    hint: '3 saved',
  },
} satisfies Meta<typeof BookmarksList>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Populated: TStory = {};

export const WithoutHint: TStory = {
  args: { hint: undefined },
};

export const Empty: TStory = {
  args: { rows: [] },
};
