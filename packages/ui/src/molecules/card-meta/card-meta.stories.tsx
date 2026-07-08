import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react';

import { CardMeta } from './card-meta';

const meta = {
  title: 'Molecules/CardMeta',
  component: CardMeta,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof CardMeta>;

export default meta;
type TStory = StoryObj<typeof meta>;

const dateIso = faker.date.past().toISOString();
const dateLabel = new Date(dateIso).toLocaleDateString('en-GB', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export const WithReadingTime: TStory = {
  args: {
    dateIso,
    dateLabel,
    readingTime: `${faker.number.int({ min: 3, max: 15 })} min`,
    category: faker.lorem.word(),
  },
};

export const WithoutReadingTime: TStory = {
  args: {
    dateIso,
    dateLabel,
    category: faker.lorem.word(),
  },
};
