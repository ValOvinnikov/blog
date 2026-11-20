import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';

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
  args: { readingTime: `${faker.number.int({ min: 3, max: 15 })} min read` },
};

export const WithoutReadingTime: TStory = {};

export const WithoutAvatar: TStory = {
  args: { author: { name: faker.person.fullName() } },
};

export const WithActions: TStory = {
  args: {
    readingTime: `${faker.number.int({ min: 3, max: 15 })} min read`,
    actions: (
      <span className="inline-flex gap-2">
        <button type="button">Save</button>
        <button type="button">Share</button>
        <button type="button">Summary</button>
      </span>
    ),
  },
};

export const WithActionsOnPhone: TStory = {
  ...WithActions,
  globals: { viewport: 'phone' },
};

export const WithLinkedAuthor: TStory = {
  args: {
    author: {
      name: faker.person.fullName(),
      imageUrl: faker.image.avatarGitHub(),
      href: `/authors/${faker.lorem.slug()}`,
    },
  },
};
