import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Prose } from './prose';

const meta: Meta<typeof Prose> = {
  title: 'Atoms/Prose',
  component: Prose,
  tags: ['autodocs'],
  args: {
    children: (
      <>
        <p>{faker.lorem.paragraphs(2, '\n\n')}</p>
        <p>{faker.lorem.paragraph()}</p>
      </>
    ),
  },
};
export default meta;

type TStory = StoryObj<typeof Prose>;

export const Default: TStory = {};
