import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react';

import { CardMeta } from './card-meta';

const dateValue = faker.date.past().toISOString();
const dateLabel = new Date(dateValue).toLocaleDateString('en-GB', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const meta = {
  title: 'Molecules/CardMeta',
  component: CardMeta,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    dateValue,
    dateLabel,
    category: faker.lorem.word(),
  },
} satisfies Meta<typeof CardMeta>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const WithReadingTime: TStory = {
  args: { readingTime: `${faker.number.int({ min: 3, max: 15 })} min` },
};

export const WithoutReadingTime: TStory = {};
