import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { TagList } from './tag-list';

const meta = {
  title: 'Molecules/TagList',
  component: TagList,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof TagList>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {
  args: {
    tags: faker.helpers.multiple(() => faker.lorem.word(), { count: 5 }),
  },
};

export const Single: TStory = {
  args: {
    tags: [faker.lorem.word()],
  },
};

export const ManyTags: TStory = {
  args: {
    tags: faker.helpers.multiple(() => faker.lorem.word(), { count: 12 }),
  },
};

export const Linked: TStory = {
  args: {
    tags: faker.helpers
      .multiple(() => faker.lorem.word(), { count: 5 })
      .map((label) => ({ label, href: `/category/${label}` })),
  },
};
