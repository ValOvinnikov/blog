import type { Meta, StoryObj } from '@storybook/react';

import { ContentModule } from './content-module';

const meta = {
  title: 'Organisms/ContentModule',
  component: ContentModule,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    title: 'About this project',
    titleId: 'content-module-title',
    children: (
      <>
        <p>
          Building a Design System from Scratch walks through the process of
          establishing tokens, atoms, molecules, and organisms that scale across
          a growing product surface.
        </p>
        <p>
          Each section below builds on the last, starting with color and
          typography tokens before moving into composable components.
        </p>
      </>
    ),
  },
} satisfies Meta<typeof ContentModule>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithoutTitle: TStory = {
  args: {
    title: undefined,
    titleId: undefined,
  },
};
