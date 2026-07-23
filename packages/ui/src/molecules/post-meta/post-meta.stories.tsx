import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react';

import { PostMeta } from './post-meta';

const publishedAt = faker.date.past().toISOString();
const formattedDate = new Date(publishedAt).toLocaleDateString('en-GB', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const meta = {
  title: 'Molecules/PostMeta',
  component: PostMeta,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    author: {
      name: faker.person.fullName(),
      imageUrl: faker.image.avatarGitHub(),
    },
    publishedAt,
    formattedDate,
  },
} satisfies Meta<typeof PostMeta>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const WithReadingTime: TStory = {
  args: { readingTimeMinutes: faker.number.int({ min: 3, max: 15 }) },
};

export const WithoutReadingTime: TStory = {};

export const WithoutAvatar: TStory = {
  args: { author: { name: faker.person.fullName() } },
};

export const WithShareSlot: TStory = {
  args: {
    share: <button type="button">Share</button>,
  },
};

export const WithCategory: TStory = {
  args: {
    category: {
      label: faker.commerce.department(),
      href: `/categories/${faker.lorem.slug()}`,
    },
  },
};
