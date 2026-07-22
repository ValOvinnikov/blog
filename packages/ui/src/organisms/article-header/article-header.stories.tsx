import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react';

import { ArticleHeader } from './article-header';

const publishedAt = faker.date.past().toISOString();
const formattedDate = new Date(publishedAt).toLocaleDateString('en-GB', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const meta = {
  title: 'Organisms/ArticleHeader',
  component: ArticleHeader,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    categories: [{ label: 'Engineering', href: '/category/engineering' }],
    title: faker.lorem.sentence({ min: 4, max: 8 }),
    lead: faker.lorem.paragraph(),
    meta: {
      author: {
        name: faker.person.fullName(),
        imageUrl: faker.image.avatarGitHub(),
      },
      publishedAt,
      formattedDate,
      readingTimeMinutes: faker.number.int({ min: 3, max: 15 }),
    },
  },
} satisfies Meta<typeof ArticleHeader>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithCoverMedia: TStory = {
  args: {
    coverMedia: (
      <img
        src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=675&fit=crop"
        alt="Code editor showing component code"
      />
    ),
  },
};

export const WithoutCategories: TStory = {
  args: { categories: undefined },
};

export const WithMultipleCategories: TStory = {
  args: {
    categories: [
      { label: 'Engineering', href: '/category/engineering' },
      { label: 'Design Systems', href: '/category/design-systems' },
      { label: 'Tooling', href: '/category/tooling' },
    ],
  },
};

export const WithoutLead: TStory = {
  args: { lead: undefined },
};

export const WithoutMeta: TStory = {
  args: { meta: undefined },
};

export const WithShareSlot: TStory = {
  args: {
    meta: {
      ...meta.args.meta,
      share: <button type="button">Share</button>,
    },
  },
};
