import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Caption } from './caption';

const meta = {
  title: 'Atoms/Caption',
  component: Caption,
  tags: ['autodocs'],
} satisfies Meta<typeof Caption>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {
  args: {
    children: `Photo by ${faker.person.fullName()} on ${faker.company.name()}`,
  },
};

export const Long: TStory = {
  args: {
    children: faker.lorem.sentence({ min: 12, max: 20 }),
    className: 'max-w-prose',
  },
};
