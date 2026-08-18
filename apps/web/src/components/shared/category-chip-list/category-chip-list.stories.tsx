import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { makeCategoryWithPostCount } from '@web/testing/shared/category/fixtures';

import { CategoryChipList } from './category-chip-list';

const categories = [
  makeCategoryWithPostCount({
    id: 'cat-1',
    title: 'Engineering',
    slug: 'engineering',
  }),
  makeCategoryWithPostCount({ id: 'cat-2', title: 'Design', slug: 'design' }),
  makeCategoryWithPostCount({ id: 'cat-3', title: 'Product', slug: 'product' }),
];

const meta = {
  title: 'Components/CategoryChipList',
  component: CategoryChipList,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { categories },
} satisfies Meta<typeof CategoryChipList>;

export default meta;
type TStory = StoryObj<typeof meta>;

/** No `activeSlug` — the "All" chip reads as active, as on `/blog`. */
export const AllActive: TStory = {};

/** `activeSlug` highlights the matching chip instead, as on `/category/[slug]`. */
export const CategoryActive: TStory = {
  args: { activeSlug: 'design' },
};

export const Empty: TStory = {
  args: { categories: [] },
};
