import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react';

import { QuoteBlock } from './quote-block';

const meta = {
  title: 'Atoms/QuoteBlock',
  component: QuoteBlock,
  tags: ['autodocs'],
  args: {
    children: faker.lorem.sentences(2),
  },
} satisfies Meta<typeof QuoteBlock>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const InArticleBody: TStory = {
  render: (args) => (
    <div className="max-w-prose text-copy">
      <p>{faker.lorem.paragraph()}</p>
      <QuoteBlock {...args} />
      <p>{faker.lorem.paragraph()}</p>
    </div>
  ),
};
