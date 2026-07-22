import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react';

import { ArticleBody } from './article-body';

const meta = {
  title: 'Organisms/ArticleBody',
  component: ArticleBody,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    children: (
      <>
        {faker.lorem
          .paragraphs(4, '\n\n')
          .split('\n\n')
          .map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
      </>
    ),
  },
} satisfies Meta<typeof ArticleBody>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};
