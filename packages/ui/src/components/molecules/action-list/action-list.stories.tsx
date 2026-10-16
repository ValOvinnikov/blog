import { TextLink } from '@blog/ui/components/atoms/text-link';
import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ActionList } from './action-list';

const meta = {
  title: 'Molecules/ActionList',
  component: ActionList,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    children: (
      <>
        <TextLink appearance="nav" href="/blog">
          {faker.lorem.words(2)}
        </TextLink>
        <TextLink appearance="nav" href="/about">
          {faker.lorem.words(2)}
        </TextLink>
      </>
    ),
  },
} satisfies Meta<typeof ActionList>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};
