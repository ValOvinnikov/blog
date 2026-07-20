import { Size } from '@blog/config';
import { objectKeys } from '@blog/utils';
import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react';

import { Prose } from './prose';
import { proseVariants } from './prose-variants';

const meta: Meta<typeof Prose> = {
  title: 'Atoms/Prose',
  component: Prose,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: objectKeys(proseVariants.variants.size),
    },
  },
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

export const Medium: TStory = {};

export const Small: TStory = {
  args: { size: Size.SM },
};

export const Large: TStory = {
  args: { size: Size.LG },
};
