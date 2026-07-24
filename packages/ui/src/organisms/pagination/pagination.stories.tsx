import type { Meta, StoryObj } from '@storybook/react-vite';

import { Pagination } from './pagination';

const createHref = (page: number) =>
  page === 1 ? '/blog' : `/blog/page/${page}`;

const meta = {
  title: 'Organisms/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    createHref,
    ariaLabel: 'Blog pages',
    previousLabel: 'Previous',
    nextLabel: 'Next',
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const MiddlePage: TStory = {
  args: { currentPage: 3, totalPages: 5 },
};

export const FirstPage: TStory = {
  args: { currentPage: 1, totalPages: 5 },
};

export const LastPage: TStory = {
  args: { currentPage: 5, totalPages: 5 },
};

export const SinglePage: TStory = {
  args: { currentPage: 1, totalPages: 1 },
};
