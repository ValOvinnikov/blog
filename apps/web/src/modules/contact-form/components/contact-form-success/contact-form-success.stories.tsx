import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { ContactFormSuccess } from './contact-form-success';

const meta = {
  title: 'Modules/ContactFormModule/ContactFormSuccess',
  component: ContactFormSuccess,
  tags: ['autodocs'],
  args: {
    title: faker.lorem.words(2),
    message: faker.lorem.sentence(),
  },
} satisfies Meta<typeof ContactFormSuccess>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};
